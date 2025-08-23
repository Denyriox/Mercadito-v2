document.addEventListener('DOMContentLoaded', () => {
    const app = {
        dolar: 0,
        products: [],
        cart: {},
        elements: {
            dolarValue: document.getElementById('dolar-value'),
            productList: document.getElementById('product-list'),
            searchBar: document.getElementById('search-bar'),
            resetSearch: document.getElementById('reset-search'),
            cartButton: document.getElementById('cart-button'),
            cartSidebar: document.getElementById('cart-sidebar'),
            closeCart: document.getElementById('close-cart'),
            cartItems: document.getElementById('cart-items'),
            cartTotalItems: document.getElementById('cart-total-items'),
            cartTotalBs: document.getElementById('cart-total-bs'),
            cartTotalUsd: document.getElementById('cart-total-usd'),
            cartProductCount: document.getElementById('cart-product-count'),
            checkoutButton: document.getElementById('checkout-button'),
            cartPreviewBar: document.getElementById('cart-preview-bar'),
            cartPreviewItems: document.getElementById('cart-preview-items'),
            cartPreviewTotal: document.getElementById('cart-preview-total'),
            openCartPreview: document.getElementById('open-cart-preview'),
        },
        init() {
            this.loadData();
            this.attachEventListeners();
            lucide.createIcons();
        },
        async loadData() {
            try {
                const response = await fetch('productos.json');
                const data = await response.json();
                this.dolar = data.dolar;
                this.products = data.productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
                this.elements.dolarValue.textContent = this.dolar.toFixed(2);
                this.loadCart();
                this.renderProducts();
            } catch (error) {
                console.error('Error loading products:', error);
            }
        },
        renderProducts(filter = '') {
            this.elements.productList.innerHTML = '';
            const filterWords = this.normalizeText(filter).split(' ').filter(Boolean);
            const filteredProducts = this.products.filter(p => {
                const nombreNorm = this.normalizeText(p.nombre);
                return filterWords.every(word => nombreNorm.includes(word));
            });
            filteredProducts.forEach(product => {
                const productCard = this.createProductCard(product);
                this.elements.productList.appendChild(productCard);
            });
        },
        createProductCard(product) {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow flex items-center justify-between gap-2';
            const quantity = this.cart[product.id] || 0;
            card.innerHTML = `
                <div class="flex-1 min-w-0">
                    <span class="font-bold">${product.nombre}</span>
                    <span class="text-xs text-gray-500 ml-2">${product.gramos}g</span>
                </div>
                <span class="mx-2 font-bold whitespace-nowrap">Bs. ${product.precio.toFixed(2)}</span>
                <div class="flex items-center space-x-1">
                    <button class="minus-button bg-gray-200 px-2 py-1 rounded" data-id="${product.id}">-</button>
                    <span class="mx-1 w-8 text-center quantity">${quantity}</span>
                    <button class="plus-button bg-gray-200 px-2 py-1 rounded" data-id="${product.id}">+</button>
                </div>
            `;
            return card;
        },
        attachEventListeners() {
            this.elements.searchBar.addEventListener('input', (e) => {
                this.renderProducts(e.target.value);
                this.elements.resetSearch.classList.toggle('hidden', !e.target.value);
            });
            this.elements.resetSearch.addEventListener('click', () => {
                this.elements.searchBar.value = '';
                this.renderProducts();
                this.elements.resetSearch.classList.add('hidden');
            });
            this.elements.productList.addEventListener('click', (e) => {
                if (e.target.classList.contains('plus-button')) {
                    this.updateCart(e.target.dataset.id, 1);
                }
                if (e.target.classList.contains('minus-button')) {
                    this.updateCart(e.target.dataset.id, -1);
                }
            });
            this.elements.cartButton.addEventListener('click', () => this.toggleCart(true));
            this.elements.closeCart.addEventListener('click', () => this.toggleCart(false));
            this.elements.checkoutButton.addEventListener('click', () => this.checkout());
            this.elements.cartItems.addEventListener('click', (e) => {
                if (e.target.closest('.restar')) {
                    this.updateCart(e.target.closest('.restar').dataset.id, -1);
                }
                if (e.target.closest('.sumar')) {
                    this.updateCart(e.target.closest('.sumar').dataset.id, 1);
                }
            });
            // Barra de previsualización del carrito
            if (this.elements.openCartPreview) {
                this.elements.openCartPreview.addEventListener('click', () => this.toggleCart(true));
            }
        },
        updateCart(productId, change) {
            const id = parseInt(productId);
            this.cart[id] = (this.cart[id] || 0) + change;
            if (this.cart[id] <= 0) {
                delete this.cart[id];
            }
            this.saveCart();
            this.renderProducts(this.elements.searchBar.value);
            this.updateCartView();
        },
        removeFromCart(productId) {
            const id = parseInt(productId);
            delete this.cart[id];
            this.saveCart();
            this.renderProducts(this.elements.searchBar.value);
            this.updateCartView();
        },
        updateCartView() {

            this.elements.cartItems.innerHTML = '';
            let totalItems = 0;
            let totalBs = 0;
            let productCount = 0;

            // Obtener los productos del carrito y ordenarlos alfabéticamente por nombre
            const cartProductList = Object.keys(this.cart)
                .map(id => {
                    const product = this.products.find(p => p.id == id);
                    return product ? { product, quantity: this.cart[id] } : null;
                })
                .filter(Boolean)
                .sort((a, b) => a.product.nombre.localeCompare(b.product.nombre));

            cartProductList.forEach(({ product, quantity }) => {
                totalItems += quantity;
                totalBs += product.precio * quantity;
                productCount++;
                const cartItem = this.createCartItem(product, quantity);
                this.elements.cartItems.appendChild(cartItem);
            });

            // Actualizar contador de productos distintos
            if (this.elements.cartProductCount) {
                this.elements.cartProductCount.textContent = productCount;
            }
            // Actualizar productos totales
            const totalProductsElem = document.getElementById('cart-total-products');
            if (totalProductsElem) {
                totalProductsElem.textContent = totalItems;
            }
            this.elements.cartTotalItems.textContent = totalItems;
            this.elements.cartTotalBs.textContent = totalBs.toFixed(2);
            const totalUsd = totalBs / this.dolar;
            this.elements.cartTotalUsd.textContent = totalUsd.toFixed(2);

            // Calcular vuelto/cambio
            const cartChangeInfo = document.getElementById('cart-change-info');
            if (cartChangeInfo) {
                if (totalUsd > 0) {
                    const usdUp = Math.ceil(totalUsd); // redondeo hacia arriba
                    const usdDown = Math.floor(totalUsd); // redondeo hacia abajo
                    const faltaUsd = +(usdUp - totalUsd).toFixed(2);
                    const devolverUsd = +(totalUsd - usdDown).toFixed(2);
                    const faltaBs = (faltaUsd * this.dolar).toFixed(2);
                    const devolverBs = (devolverUsd * this.dolar).toFixed(2);
                    cartChangeInfo.innerHTML =
                        `<span><span style="color: red;">Vuelto:</span> <b>Bs. ${faltaBs}</b> si paga <b>${usdUp} USD</b></span>` +
                        `<span><span style="color: green;">Completar:</span> <b>Bs. ${devolverBs}</b> si paga <b>${usdDown === 0 ? '' : usdDown + ' USD'}</b>${usdDown === 0 ? '' : ''}</span>`;
                } else {
                    cartChangeInfo.innerHTML = '';
                }
            }

            // Actualizar barra de previsualización
            if (this.elements.cartPreviewBar) {
                this.elements.cartPreviewItems.textContent = `${totalItems} producto${totalItems === 1 ? '' : 's'}`;
                this.elements.cartPreviewTotal.textContent = totalBs.toFixed(2);
                // Mostrar/ocultar barra según si hay productos y si el carrito está cerrado
                const cartOpen = !this.elements.cartSidebar.classList.contains('translate-x-full');
                this.elements.cartPreviewBar.style.display = (!cartOpen && totalItems > 0) ? 'flex' : 'none';
            }
        },
        createCartItem(product, quantity) {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between gap-2 mb-2';
            item.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div>
                        <span class="font-semibold">${product.nombre}</span>
                        <span class="text-xs text-gray-500 ml-2">${product.gramos}g</span>
                    </div>
                    <div class="text-xs text-gray-500">Bs. ${product.precio.toFixed(2)} c/u</div>
                </div>
                <span class="mx-2 font-bold whitespace-nowrap">Bs. ${(product.precio * quantity).toFixed(2)}</span>
                <div class="flex items-center space-x-1">
                    <button class="restar bg-gray-200 px-2 py-1 rounded" data-id="${product.id}">-</button>
                    <span class="mx-1">${quantity}</span>
                    <button class="sumar bg-gray-200 px-2 py-1 rounded" data-id="${product.id}">+</button>
                </div>
            `;
            return item;
        },
        toggleCart(open) {
            this.elements.cartSidebar.classList.toggle('translate-x-full', !open);
            // Ocultar barra de previsualización cuando el carrito está abierto
            if (this.elements.cartPreviewBar) {
                this.elements.cartPreviewBar.style.display = open ? 'none' : (Object.values(this.cart).reduce((a,b)=>a+b,0) > 0 ? 'flex' : 'none');
            }
        },
        checkout() {
            this.cart = {};
            this.saveCart();
            this.renderProducts(this.elements.searchBar.value);
            this.updateCartView();
            this.toggleCart(false);
        },
        saveCart() {
            localStorage.setItem('mercadito-cart', JSON.stringify(this.cart));
        },
        loadCart() {
            const savedCart = localStorage.getItem('mercadito-cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
            this.updateCartView();
        },
        normalizeText(text) {
            return text
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[-]/g, ' ')
                .replace(/\s+/g, ' ') // Opcional: normaliza espacios múltiples
                .trim();
        }
    };
    app.init();
});
