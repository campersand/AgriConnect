// script.js - logic for main, food, keranjang pages
// Requires products.js to be loaded first.

(function(){
  const CART_KEY = 'agriCart';

  /* ---------- Helpers ---------- */
  function rupiah(n){
    return 'Rp ' + Number(n).toLocaleString('id-ID');
  }

  function getCart(){
    try{
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      return [];
    }
  }
  function saveCart(arr){
    localStorage.setItem(CART_KEY, JSON.stringify(arr));
  }
  function addToCart(item){
    const cart = getCart();
    cart.push(item);
    saveCart(cart);
  }
  function removeFromCartByIndex(idx){
    const cart = getCart();
    if(idx >=0 && idx < cart.length){
      cart.splice(idx,1);
      saveCart(cart);
    }
  }

  /* ---------- Main Page Functions ---------- */
  function renderProductsList(products, container){
    container.innerHTML = '';
    if(products.length === 0){
      const el = document.createElement('div');
      el.textContent = 'Tidak ada produk ditemukan.';
      el.style.color = '#555';
      container.appendChild(el);
      return;
    }

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.image || 'img/placeholder.jpg'}" alt="${p.name}" onerror="this.onerror=null;this.src='img/placeholder.jpg'">
        <div>
          <h3>${p.name}</h3>
          <div class="meta">
            <div>${p.farmer}</div>
            <div class="price">${rupiah(p.price)}/kg</div>
          </div>
        </div>
        <div class="actions">
          <a class="btn btn-outline small" href="food.html?id=${encodeURIComponent(p.id)}">Detail</a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function initMain(){
    const searchInput = document.getElementById('searchInput');
    const grid = document.getElementById('productGrid');
    const filterCheckboxes = Array.from(document.querySelectorAll('.cat-checkbox'));

    let current = window.products.slice();

    function applyFilters(){
      const q = searchInput.value.trim().toLowerCase();
      const activeCats = filterCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
      let filtered = window.products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(q);
        const matchCat = activeCats.length === 0 ? true : activeCats.includes(p.category);
        return matchSearch && matchCat;
      });
      current = filtered;
      renderProductsList(current, grid);
    }

    searchInput.addEventListener('input', applyFilters);
    filterCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    // initial render
    renderProductsList(current, grid);
  }

  /* ---------- Food (detail) Page ---------- */
  function getQueryParam(name){
    const params = new URLSearchParams(location.search);
    return params.get(name);
  }

  function initFood(){
    const id = getQueryParam('id');
    const product = window.products.find(p => String(p.id) === String(id));
    const containerImage = document.getElementById('productImage');
    const containerName = document.getElementById('productName');
    const containerFarmer = document.getElementById('productFarmer');
    const containerPrice = document.getElementById('productPrice');
    const inputKg = document.getElementById('inputKg');
    const btnAdd = document.getElementById('btnAdd');
    const btnBack = document.getElementById('btnBack');

    if(!product){
      containerName.textContent = 'Produk tidak ditemukan';
      containerFarmer.textContent = '';
      containerPrice.textContent = '';
      containerImage.src = 'img/placeholder.jpg';
      btnAdd.disabled = true;
      return;
    }

    containerImage.src = product.image || 'img/placeholder.jpg';
    containerImage.onerror = function(){ this.src = 'img/placeholder.jpg'; }
    containerName.textContent = product.name;
    containerFarmer.textContent = 'Petani: ' + product.farmer;
    containerPrice.textContent = rupiah(product.price) + '/kg';

    btnBack.addEventListener('click', function(e){
      e.preventDefault();
      location.href = 'index.html';
    });

    btnAdd.addEventListener('click', function(){
      const kg = parseFloat(inputKg.value);
      if(isNaN(kg) || kg < 1){
        alert('Masukkan jumlah (kg) minimal 1.');
        return;
      }
      const item = {
        id: product.id,
        name: product.name,
        pricePerKg: product.price,
        weightKg: kg,
        totalPrice: Math.round(product.price * kg)
      };
      addToCart(item);
      alert('Produk ditambahkan ke keranjang.');
      // optional: redirect to cart
      // location.href = 'keranjang.html';
    });
  }

  /* ---------- Keranjang Page ---------- */
  function initCart(){
    const tableBody = document.getElementById('cartBody');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const emptyText = document.getElementById('emptyText');

    function renderCart(){
      const cart = getCart();
      tableBody.innerHTML = '';
      if(cart.length === 0){
        emptyText.style.display = 'block';
        totalEl.textContent = rupiah(0);
        checkoutBtn.disabled = true;
        return;
      } else {
        emptyText.style.display = 'none';
        checkoutBtn.disabled = false;
      }

      let total = 0;
      cart.forEach((it, idx) => {
        const tr = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.textContent = it.name;
        const weightTd = document.createElement('td');
        weightTd.textContent = it.weightKg + ' kg';
        const priceTd = document.createElement('td');
        priceTd.textContent = rupiah(it.totalPrice);
        const actionTd = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-outline small';
        delBtn.textContent = 'Hapus';
        delBtn.addEventListener('click', () => {
          if(confirm('Hapus item ini dari keranjang?')){
            removeFromCartByIndex(idx);
            renderCart();
          }
        });
        actionTd.appendChild(delBtn);

        tr.appendChild(nameTd);
        tr.appendChild(weightTd);
        tr.appendChild(priceTd);
        tr.appendChild(actionTd);
        tableBody.appendChild(tr);

        total += Number(it.totalPrice) || 0;
      });

      totalEl.textContent = rupiah(total);
    }

    checkoutBtn.addEventListener('click', function(){
      const cart = getCart();
      if(cart.length === 0){
        alert('Keranjang masih kosong');
        return;
      }
      alert("Checkout berhasil! Pesanan akan segera diproses.");
      // Clear cart after checkout
      saveCart([]);
      renderCart();
    });

    renderCart();
  }

  /* ---------- Initialize based on body data-page ---------- */
  document.addEventListener('DOMContentLoaded', function(){
    const page = document.body.getAttribute('data-page');
    if(page === 'main') initMain();
    if(page === 'food') initFood();
    if(page === 'cart') initCart();

    // simple nav active link
    const loc = location.pathname.split('/').pop();
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      if(href === loc || (loc === '' && href === 'index.html')){
        a.classList.add('active');
      }
    });
  });

})();


