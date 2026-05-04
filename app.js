const firebaseConfig = {
  apiKey: "AIzaSyANi7ygwkwAJa-ZEA60qBs4GFjzVXL6cKM",
  authDomain: "site-sismai.firebaseapp.com",
  projectId: "site-sismai",
  storageBucket: "site-sismai.firebasestorage.app",
  messagingSenderId: "864633846451",
  appId: "1:864633846451:web:cbdd8140b9bf61323a0ec6"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const app = {
    isAdmin: false,
    isCustomerLoggedIn: false,
    isLoginMode: true,
    isNewUser: false,
    products: [],
    cart: [],

    defaultProducts: [
        { id: 1, name: 'Sérum Revitalizante Facial', desc: 'Hidratação profunda para brilho diário.', category: 'feminino', price: 129.90, img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
        { id: 2, name: 'Hidratante Corporal Pêssego', desc: 'Pele macia com toque aveludado.', category: 'feminino', price: 89.90, img: 'https://images.unsplash.com/photo-1615397323114-18e38d97e748?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
        { id: 3, name: 'Loção Pós-Barba Refrescante', desc: 'Acalma a pele após o barbear.', category: 'masculino', price: 75.50, img: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
        { id: 4, name: 'Balm para Barba', desc: 'Fios alinhados e hidratados.', category: 'masculino', price: 65.00, img: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' }
    ],

    showPage: (pageId) => {
        document.querySelectorAll('.page').forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });
        const activePage = document.getElementById('page-' + pageId);
        if (activePage) {
            activePage.style.display = 'block';
            activePage.classList.add('active');
        }
        window.scrollTo(0, 0);
        
        // Hide admin tools if not home
        const tools = document.getElementById('admin-tools');
        if (tools && app.isAdmin) {
            tools.style.display = pageId === 'home' ? 'block' : 'none';
        }

        if (pageId === 'cart') {
            app.renderCart();
        }
        if (pageId === 'pedidos') {
            app.renderOrders();
        }
        app.updateNavbar();
    },

    updateNavbar: () => {
        const nav = document.querySelector('.navbar');
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.id === 'page-home') {
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        } else {
            nav.classList.add('scrolled');
        }
    },

    toggleMenu: () => {
        const sidebar = document.getElementById('hamburger-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            setTimeout(() => overlay.style.display = 'none', 300);
        } else {
            overlay.style.display = 'block';
            setTimeout(() => {
                sidebar.classList.add('open');
                overlay.classList.add('open');
            }, 10);
        }
    },

    scrollToSection: (id) => {
        app.showPage('home');
        app.toggleMenu();
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        }, 300);
    },

    init: async () => {
        // Load products from Firestore
        db.collection('ls_products').onSnapshot(snapshot => {
            app.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Se o banco do Firebase estiver vazio, vamos migrar os produtos que o usuário tinha salvo no LocalStorage
            if (app.products.length === 0) {
                const savedLocal = localStorage.getItem('natura_clone_products');
                if (savedLocal) {
                    const localProducts = JSON.parse(savedLocal);
                    localProducts.forEach(async (prod) => {
                        try {
                            const { id, ...prodSemId } = prod; // Removemos o ID antigo em número para o Firebase criar o dele em texto
                            await db.collection('ls_products').add(prodSemId);
                        } catch(e) { console.error(e); }
                    });
                } else {
                    app.products = [...app.defaultProducts];
                }
            }
            app.renderProducts();
        });

        // Load cart
        const savedCart = localStorage.getItem('natura_clone_cart');
        if (savedCart) {
            app.cart = JSON.parse(savedCart);
        }

        // Check auth with Firebase
        auth.onAuthStateChanged((user) => {
            if (user) {
                app.isCustomerLoggedIn = true;
                app.isAdmin = user.email === 'maickluiz8@gmail.com';
                document.getElementById('main-nav').style.display = 'flex';
                
                const name = user.displayName || user.email.split('@')[0];
                const welcomeMsg = document.getElementById('welcome-message');
                const icon = '<i class="fas fa-sparkles" style="color: var(--accent); margin-right: 8px;"></i>';
                if (app.isNewUser) {
                    welcomeMsg.innerHTML = `${icon} Olá, ${name}! É muito bom ter você conosco.`;
                    app.isNewUser = false; // reset
                } else {
                    welcomeMsg.innerHTML = `${icon} Olá, ${name}! É muito bom ter você de volta.`;
                }
                
                app.showPage('home');
            } else {
                app.isCustomerLoggedIn = false;
                app.isAdmin = false;
                document.getElementById('main-nav').style.display = 'none';
                app.showPage('login');
            }
            app.updateAdminUI();
            app.renderProducts();
        });
        
        app.updateCartBadge();

        // Render
        app.renderProducts();
        app.setupListeners();

        window.addEventListener('scroll', () => {
            app.updateNavbar();
        });
        app.updateNavbar();
    },

    saveProducts: () => {
        // Obsoleto: Substituído pelo Firestore
    },

    saveCart: () => {
        localStorage.setItem('natura_clone_cart', JSON.stringify(app.cart));
        app.updateCartBadge();
    },

    addToCart: (productId) => {
        const prod = app.products.find(p => p.id === productId);
        if (prod) {
            const existing = app.cart.find(item => item.id === productId);
            if (existing) {
                existing.qty += 1;
            } else {
                app.cart.push({ ...prod, qty: 1 });
            }
            app.saveCart();
            app.showToast('Adicionado ao carrinho!');
            
            const badge = document.getElementById('cart-badge');
            badge.classList.remove('bounce');
            void badge.offsetWidth; // trigger reflow
            badge.classList.add('bounce');
        }
    },

    removeFromCart: (productId) => {
        app.cart = app.cart.filter(item => item.id !== productId);
        app.saveCart();
        app.renderCart();
        app.showToast('Item removido do carrinho.');
    },

    updateCartBadge: () => {
        const badge = document.getElementById('cart-badge');
        const totalItems = app.cart.reduce((sum, item) => sum + item.qty, 0);
        if (totalItems > 0) {
            badge.style.display = 'inline-block';
            badge.innerText = totalItems;
        } else {
            badge.style.display = 'none';
        }
    },

    renderCart: () => {
        const container = document.getElementById('cart-items');
        if (app.cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 20px;">Seu carrinho está vazio.</p>';
            document.getElementById('cart-total').innerText = '0,00';
            document.getElementById('btn-checkout').style.display = 'none';
            return;
        }

        document.getElementById('btn-checkout').style.display = 'block';

        let total = 0;
        let html = '';
        app.cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            html += `
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding: 15px 0;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${item.img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        <div>
                            <h4 style="color: var(--text); margin-bottom: 5px;">${item.name}</h4>
                            <p style="font-size: 0.9rem; color: var(--text-light);">${item.qty}x R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <strong style="color: var(--primary);">R$ ${itemTotal.toFixed(2).replace('.', ',')}</strong>
                        <button onclick="app.removeFromCart('${item.id}')" style="background: none; border: none; color: #ff9999; cursor: pointer; font-size: 1.2rem;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        document.getElementById('cart-total').innerText = total.toFixed(2).replace('.', ',');
    },

    renderProducts: () => {
        const gridFem = document.getElementById('grid-feminino');
        const gridMasc = document.getElementById('grid-masculino');

        gridFem.innerHTML = '';
        gridMasc.innerHTML = '';

        app.products.forEach(p => {
            const html = `
                <div class="product-card">
                    <img src="${p.img || 'https://via.placeholder.com/250x200?text=Sem+Imagem'}" alt="${p.name}" class="product-img">
                    <h3 class="product-title">${p.name}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 10px;">${p.desc || ''}</p>
                    <p class="product-price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn btn-secondary" style="width: 100%;" onclick="app.addToCart('${p.id}')">Comprar</button>
                    
                    ${app.isAdmin ? `
                        <div class="admin-controls">
                            <button class="btn-edit" onclick="app.openEditProductModal('${p.id}')"><i class="fas fa-edit"></i> Editar</button>
                            <button class="btn-delete" onclick="app.deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    ` : ''}
                </div>
            `;

            if (p.category === 'feminino') gridFem.innerHTML += html;
            if (p.category === 'masculino') gridMasc.innerHTML += html;
        });

        if (gridFem.innerHTML === '') gridFem.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-light);">Nenhum produto cadastrado.</p>';
        if (gridMasc.innerHTML === '') gridMasc.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-light);">Nenhum produto cadastrado.</p>';
    },

    searchProducts: () => {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        if (!query) {
            app.showPage('home');
            return;
        }

        const gridSearch = document.getElementById('grid-search');
        gridSearch.innerHTML = '';

        const results = app.products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.desc && p.desc.toLowerCase().includes(query))
        );

        if (results.length === 0) {
            gridSearch.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-light);">Nenhum produto encontrado.</p>';
        } else {
            results.forEach(p => {
                gridSearch.innerHTML += `
                    <div class="product-card">
                        <img src="${p.img || 'https://via.placeholder.com/250x200?text=Sem+Imagem'}" alt="${p.name}" class="product-img">
                        <h3 class="product-title">${p.name}</h3>
                        <p style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 10px;">${p.desc || ''}</p>
                        <p class="product-price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                        <button class="btn btn-secondary" style="width: 100%;" onclick="app.addToCart('${p.id}')">Comprar</button>
                        
                        ${app.isAdmin ? `
                            <div class="admin-controls">
                                <button class="btn-edit" onclick="app.openEditProductModal('${p.id}')"><i class="fas fa-edit"></i> Editar</button>
                                <button class="btn-delete" onclick="app.deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        app.showPage('search');
    },

    renderOrders: async () => {
        const container = document.getElementById('orders-list');
        container.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando pedidos...</p>';
        
        try {
            const snapshot = await db.collection('ls_orders').orderBy('created_at', 'desc').get();
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhum pedido encontrado no banco de dados.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const order = doc.data();
                const data = order.created_at ? order.created_at.toDate().toLocaleString('pt-BR') : 'Data não disponível';
                
                let itemsHtml = '';
                order.items.forEach(i => {
                    itemsHtml += `<div style="margin-left: 10px; font-size: 0.9rem;">- ${i.qty}x ${i.name}</div>`;
                });

                html += `
                    <div style="background: rgba(255,255,255,0.8); border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                            <strong>Pedido #${doc.id.substring(0,6).toUpperCase()}</strong>
                            <span style="color: var(--text-light); font-size: 0.9rem;">${data}</span>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Itens:</strong>
                            ${itemsHtml}
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Endereço:</strong> ${order.delivery_address.rua}, ${order.delivery_address.numero} - ${order.delivery_address.bairro}, ${order.delivery_address.cidade}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                            <span style="background: #eee; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">Pagamento: ${order.payment_method.toUpperCase()}</span>
                            <strong style="color: var(--primary); font-size: 1.2rem;">Total: R$ ${parseFloat(order.total).toFixed(2).replace('.', ',')}</strong>
                        </div>
                        <div style="margin-top: 15px;">
                            ${order.customer_phone ? 
                                `<button class="btn btn-primary" style="width: 100%;" onclick="app.notifyShipping('${doc.id}', '${order.customer_phone}', '${order.customer_name}')"><i class="fab fa-whatsapp"></i> Notificar Saída para Entrega</button>` 
                                : '<span style="color: var(--text-light); font-size: 0.8rem;">Cliente não cadastrou WhatsApp</span>'}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">Erro ao carregar pedidos. Verifique suas permissões.</p>';
        }
    },

    setupListeners: () => {
        // Customer Login / Register
        document.getElementById('customer-login-form').onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            const nameInput = document.getElementById('login-name');
            
            try {
                if (app.isLoginMode) {
                    await auth.signInWithEmailAndPassword(email, pass);
                    app.showToast('Bem-vindo(a) de volta!');
                } else {
                    app.isNewUser = true;
                    const name = nameInput.value;
                    const phone = document.getElementById('login-whatsapp').value;
                    const cred = await auth.createUserWithEmailAndPassword(email, pass);
                    await cred.user.updateProfile({ displayName: name });
                    
                    // Save user data
                    await db.collection('ls_users').doc(cred.user.uid).set({
                        name: name,
                        email: email,
                        phone: phone
                    });
                    
                    app.showToast('Conta criada com sucesso! Bem-vindo(a), ' + name);
                }
                e.target.reset();
            } catch (error) {
                app.showToast('Erro: ' + error.message);
            }
        };

        // Checkout Form
        document.getElementById('checkout-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const cep = form.elements[0].value;
            const cleanCep = cep.replace(/\D/g, '');
            
            if (cleanCep !== '45680000' && cleanCep !== '45689000') {
                app.showToast('Desculpe, só realizamos entregas em Uruçuca e Serra Grande (BA).');
                return;
            }

            const address = {
                cep: cep,
                rua: form.elements[1].value,
                numero: form.elements[2].value,
                complemento: form.elements[3].value,
                bairro: form.elements[4].value,
                cidade: form.elements[5].value
            };
            const payment = window.selectedPayment || 'Não especificado';
            const total = app.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

            try {
                app.showToast('Processando pedido...');
                
                let phone = '';
                if(auth.currentUser) {
                    const userDoc = await db.collection('ls_users').doc(auth.currentUser.uid).get();
                    if(userDoc.exists) phone = userDoc.data().phone;
                }

                const customerName = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email) : 'Cliente';

                await db.collection('ls_orders').add({
                    delivery_address: address,
                    payment_method: payment,
                    total: total,
                    items: app.cart,
                    status: 'pendente',
                    customer_phone: phone,
                    customer_name: customerName,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Format WhatsApp Message
                let waText = `*NOVO PEDIDO - LS VARIEDADES*\n`;
                waText += `*👤 Cliente:* ${customerName}\n\n`;
                waText += `*📦 Itens:*\n`;
                app.cart.forEach(item => {
                    waText += `- ${item.qty}x ${item.name} (R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')})\n`;
                });
                waText += `\n*💰 Total:* R$ ${total.toFixed(2).replace('.', ',')}\n`;
                waText += `*💳 Pagamento:* ${payment.toUpperCase()}\n\n`;
                waText += `*📍 Endereço de Entrega:*\n`;
                waText += `CEP: ${address.cep}\n`;
                waText += `${address.rua}, ${address.numero}`;
                if (address.complemento) waText += ` - ${address.complemento}`;
                waText += `\n${address.bairro} - ${address.cidade}`;

                const waLink = `https://wa.me/5573981088236?text=${encodeURIComponent(waText)}`;

                app.cart = [];
                app.saveCart();
                app.showPage('home');
                app.showToast('Pedido Confirmado! Redirecionando para o WhatsApp...');
                form.reset();
                
                // Redirecionamento direto para evitar bloqueio em celulares
                window.location.href = waLink;

            } catch (error) {
                app.showToast('Erro ao confirmar pedido: ' + error.message);
            }
        };

        // Admin Login
        document.getElementById('admin-form').onsubmit = async (e) => {
            e.preventDefault();
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            try {
                await auth.signInWithEmailAndPassword(user, pass);
                app.toggleAdminLogin();
                app.showToast('Login de administrador bem-sucedido!');
            } catch (error) {
                app.showToast('Credenciais incorretas ou erro: ' + error.message);
            }
        };

        // Add Product
        document.getElementById('add-product-form').onsubmit = async (e) => {
            e.preventDefault();
            
            let imgBase64 = 'https://via.placeholder.com/250x200?text=Sem+Imagem';
            const fileInput = document.getElementById('prod-img-file');
            if (fileInput.files.length > 0) {
                imgBase64 = await app.getBase64(fileInput.files[0]);
            }

            const newProd = {
                name: document.getElementById('prod-name').value,
                desc: document.getElementById('prod-desc').value,
                category: document.getElementById('prod-category').value,
                price: parseFloat(document.getElementById('prod-price').value),
                img: imgBase64
            };

            try {
                await db.collection('ls_products').add(newProd);
                app.closeAddProductModal();
                app.showToast('Produto adicionado ao banco de dados!');
                e.target.reset();
            } catch (error) {
                app.showToast('Erro ao salvar produto: ' + error.message);
            }
        };

        // Edit Product
        document.getElementById('edit-product-form').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-prod-id').value;
            const prod = app.products.find(p => p.id === id);
            
            if (prod) {
                const updatedData = {
                    name: document.getElementById('edit-prod-name').value,
                    desc: document.getElementById('edit-prod-desc').value,
                    price: parseFloat(document.getElementById('edit-prod-price').value)
                };
                
                const fileInput = document.getElementById('edit-prod-img-file');
                if (fileInput.files.length > 0) {
                    updatedData.img = await app.getBase64(fileInput.files[0]);
                }
                
                try {
                    await db.collection('ls_products').doc(id).update(updatedData);
                    app.closeEditProductModal();
                    app.showToast('Produto atualizado com sucesso!');
                    fileInput.value = ''; // clear
                } catch (error) {
                    app.showToast('Erro ao atualizar produto: ' + error.message);
                }
            }
        };
    },

    updateAdminUI: () => {
        const tools = document.getElementById('admin-tools');
        const isHome = document.getElementById('page-home').classList.contains('active');
        if (tools) tools.style.display = (app.isAdmin && isHome) ? 'block' : 'none';
    },

    logoutUser: async () => {
        try {
            await auth.signOut();
            app.showToast('Você saiu.');
        } catch (error) {
            console.error(error);
        }
    },

    maskCEP: (el) => {
        let v = el.value.replace(/\D/g, '');
        if (v.length > 5) {
            v = v.substring(0,5) + '-' + v.substring(5,8);
        }
        el.value = v;

        const cleanCep = v.replace(/\D/g, '');
        const cidadeInput = document.getElementById('checkout-cidade');
        if (cidadeInput) {
            if (cleanCep === '45680000') {
                cidadeInput.value = 'Uruçuca / BA';
            } else if (cleanCep === '45689000') {
                cidadeInput.value = 'Serra Grande (Uruçuca) / BA';
            } else {
                cidadeInput.value = '';
            }
        }
    },

    toggleLoginMode: () => {
        app.isLoginMode = !app.isLoginMode;
        const nameField = document.getElementById('login-name');
        const phoneField = document.getElementById('login-whatsapp');
        const btnSubmit = document.getElementById('btn-login-submit');
        const toggleText = document.getElementById('login-toggle-text');
        const btnToggle = document.getElementById('btn-login-toggle');

        if (app.isLoginMode) {
            nameField.style.display = 'none';
            nameField.required = false;
            phoneField.style.display = 'none';
            phoneField.required = false;
            btnSubmit.innerText = 'Entrar';
            toggleText.innerText = 'Ainda não tem conta?';
            btnToggle.innerText = 'Criar Nova Conta';
        } else {
            nameField.style.display = 'block';
            nameField.required = true;
            phoneField.style.display = 'block';
            phoneField.required = true;
            btnSubmit.innerText = 'Cadastrar e Entrar';
            toggleText.innerText = 'Já possui uma conta?';
            btnToggle.innerText = 'Fazer Login';
        }
    },

    notifyShipping: async (orderId, phone, name) => {
        try {
            await db.collection('ls_orders').doc(orderId).update({ status: 'saiu_entrega' });
            app.showToast('Status atualizado!');
            const cleanPhone = phone.replace(/\D/g, '');
            if(cleanPhone) {
                const msg = `Olá ${name}! O seu pedido da LS Variedades acabou de sair para entrega. 🛵📦 Prepare-se para receber!`;
                window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
            }
            app.renderOrders();
        } catch(e) {
            app.showToast('Erro: ' + e.message);
        }
    },

    openAddProductModal: () => {
        document.getElementById('add-product-modal').style.display = 'flex';
    },

    closeAddProductModal: () => {
        document.getElementById('add-product-modal').style.display = 'none';
    },

    openEditProductModal: (id) => {
        const prod = app.products.find(p => p.id === id);
        if (!prod) return;

        document.getElementById('edit-prod-id').value = prod.id;
        document.getElementById('edit-prod-name').value = prod.name;
        document.getElementById('edit-prod-desc').value = prod.desc || '';
        document.getElementById('edit-prod-price').value = prod.price;
        // Do not set file input value, it's not allowed for security reasons

        document.getElementById('edit-product-modal').style.display = 'flex';
    },

    closeEditProductModal: () => {
        document.getElementById('edit-product-modal').style.display = 'none';
        document.getElementById('edit-prod-img-file').value = ''; // clear on close
    },

    getBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    deleteProduct: async (id) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await db.collection('ls_products').doc(id).delete();
                app.showToast('Produto excluído com sucesso.');
            } catch (error) {
                app.showToast('Erro ao excluir produto: ' + error.message);
            }
        }
    },

    showToast: (msg) => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-bell" style="margin-right:8px; color: var(--primary);"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
};

window.onload = app.init;
