document.addEventListener("DOMContentLoaded", async () => {
  let allProducts = [];
  let filteredProducts = [];
  let currentPage = 1;
  const productsPerPage = 10;
  let loadMoreButton = "";
  let sortDirection = "asc";
  const dbName = "productsDB";
  const storeName = "products";
  let db;
/* Indexed DB Storage of Products and Preferences */
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 2);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("preferences")) {
          db.createObjectStore("preferences", { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = (event) => {
      
        reject(event.target.errorCode);
      };
    });
  };

  
  const savePreferencesToDB = (preferences) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["preferences"], "readwrite");
      const store = transaction.objectStore("preferences");

      Object.keys(preferences).forEach((key) => {
        store.put({ key, value: preferences[key] });
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        
        reject(event.target.errorCode);
      };
    });
  };

  const savePreferences = () => {
    const selectedCategories = Array.from(
      document.querySelectorAll(".category-checkbox:checked")
    ).map((checkbox) => checkbox.value);

    savePreferencesToDB({
      sortDirection,
      selectedCategories,
    });
  };

  document.querySelectorAll(".category-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      handleCheckboxChanges();
      savePreferences();
    });
  });

  const sortSelects = document.querySelector("#sort-select");
  if (sortSelects) {
    sortSelects.addEventListener("change", () => {
      sortDirection = sortSelects.value;
      sortProducts();
      savePreferences();
    });
  }
   document
    .querySelector("#sort-select")
    .addEventListener("change", (event) => {

      const sortOption = event.target.value;
      sortProduct(sortOption);
    });

  const sortProduct = (option) => {
    switch (option) {
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    updateContent();
  };

  const saveProductsToDB = (products) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      products.forEach((product) => {
        store.put(product);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject(event.target.errorCode);
      };
    });
  };
  const getProductsFromDB = () => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
       
        reject(event.target.errorCode);
      };
    });
  };
 /* Debounce function on Search */
  function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }
/* Modal Management */
  const modal = document.getElementById("myModal");

  const btn = document.getElementById("openModalButton");

  const span = document.getElementsByClassName("close")[0];

  btn.onclick = function () {
    modal.style.display = "block";
  };

  span.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
/*Search Functionality */
  const searchInput = document.querySelector("#search-products");
  const searchInputs = document.querySelector("#search-productsmob");
  const performSearchmob = () => {
    const query = searchInputs.value.toLowerCase();
    filteredProducts = allProducts.filter((product) =>
      product.title.toLowerCase().includes(query)
    );
    currentPage = 1;
    updateContent();
  };

  const performSearch = () => {
    const query = searchInput.value.toLowerCase();
    filteredProducts = allProducts.filter((product) =>
      product.title.toLowerCase().includes(query)
    );
    currentPage = 1;
    updateContent();
  };

  const debouncedSearch = debounce(performSearch, 1000);
  const debouncedSearchmob = debounce(performSearchmob, 1000);

  searchInput.addEventListener("input", debouncedSearch);
  searchInputs.addEventListener("input", debouncedSearchmob);
  const clearIcon = document.querySelector("#clear-icon");
  clearIcon.addEventListener("click", () => {
    searchInput.value = "";
    debouncedSearch();
  });
  const clearIcons = document.querySelector("#clear-icons");
  clearIcons.addEventListener("click", () => {
    searchInputs.value = "";
    debouncedSearchmob();
  });
/* Handling categories via filter */
  const handleCheckboxChanges = async () => {
    const selectedCategories = Array.from(
      document.querySelectorAll(".category-checkbox:checked")
    ).map((checkbox) => checkbox.value);

    if (selectedCategories.length > 0) {
      filteredProducts = allProducts.filter((product) =>
        selectedCategories.includes(product.category)
      );
    } else {
      filteredProducts = allProducts;
    }

    currentPage = 1;
    updateContent();

    await savePreferencesToDB({
      sortDirection,
      selectedCategories,
      filteredProducts,
    });
  };

  document.querySelectorAll(".category-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", handleCheckboxChanges);
  });
  const fetchProducts = async () => {
    const loader = document.querySelector("#loader");
    const loadMoreButton = document.querySelector(".load-more-products");
    const seeResultsProducts = document.querySelector(".see-results-products");
    const productContainer = document.querySelector(".products-list");
    const noProductsMessage = document.querySelector("#no-products-message");

    if (noProductsMessage) noProductsMessage.classList.add("hidden");

    if (loader) loader.classList.remove("hidden");
    if (loadMoreButton) loadMoreButton.classList.add("hidden");
    if (seeResultsProducts) seeResultsProducts.classList.add("hidden");

    try {
      await openDB();

      const cachedProducts = await getProductsFromDB();
      if (cachedProducts.length > 0) {
        allProducts = cachedProducts;
        filteredProducts = allProducts;
        updateContent();
      } else {
        displayPlaceholders();
        const response = await fetch("https://fakestoreapi.com/products");

        if (!response.ok) throw new Error("Network response was not ok");

        const allProductsData = await response.json();

        if (allProductsData.length === 0) throw new Error("No products found");

        allProducts = allProductsData;
        filteredProducts = allProducts;

        await saveProductsToDB(allProducts);

        updateContent();
      }
    } catch {
      

      if (productContainer) productContainer.innerHTML = "";
      if (noProductsMessage) noProductsMessage.classList.remove("hidden");

      if (loadMoreButton) loadMoreButton.classList.add("hidden");
    } finally {
      if (loader) loader.classList.add("hidden");
      if (allProducts && allProducts.length > 0) {
        if (loadMoreButton) loadMoreButton.classList.remove("hidden");
      }
      if (seeResultsProducts) seeResultsProducts.classList.remove("hidden");
    }
  };

  const displayPlaceholders = () => {
    const productsList = document.querySelector(".products-list");
    if (!productsList) return;

    productsList.innerHTML = "";

    for (let i = 0; i < productsPerPage; i++) {
      const placeholderDiv = document.createElement("div");
      placeholderDiv.classList.add("product-box", "placeholder");

      placeholderDiv.innerHTML = `
                <div class="product-img-row">
                    <div class="placeholder-img"></div>
                </div>
                <div class="product-info">
                    <div class="product-name placeholder-text"></div>
                    <div class="product-price placeholder-text"></div>
                </div>
            `;

      productsList.appendChild(placeholderDiv);
    }
  };

  const loadMoreProducts = async () => {
    currentPage++;
    updateContent();
  };

  const updateContent = () => {
    const productsContainer = document.querySelector(".products-list");
    const noProductsMessage = document.querySelector("#no-products");

    if (currentPage === 1) {
        productsContainer.innerHTML = "";
    }

    if (filteredProducts.length === 0) {
        noProductsMessage.style.display = "block";
        if (loadMoreButton) loadMoreButton.style.display = "none";
        return; 
    } else {
        noProductsMessage.style.display = "none";
    }

    
    const start = (currentPage - 1) * productsPerPage;
    const end = Math.min(start + productsPerPage, filteredProducts.length);
    const productsToShow = filteredProducts.slice(start, end);

    productsToShow.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-box");
        productCard.innerHTML = `
            <div class="product-img-row">
                <img src="${product.image}" alt="${product.title}" class="product-img">
            </div>
            <div class="product-info">
                <div class="product-name">${product.title}</div>
                <div class="product-price">$${product.price}</div>
                <div class="product-heart">
                    <img src="./assets/images/heart.png" alt="Heart">
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
    const seeResultsButton = document.querySelector("#see-results");
    if (seeResultsButton) {
     
      seeResultsButton.textContent = `See ${Math.max(
            currentPage * productsPerPage,
            filteredProducts.length
        )} Results`;
    
      seeResultsButton.addEventListener("click", () => {
        menu.classList.remove("open");
      });
    }
    
    const resultCount = document.querySelector(".result-count");
    
    if (resultCount) {
    
        resultCount.textContent = `${Math.min(
            currentPage * productsPerPage,
            filteredProducts.length
        )} products`;  console.log(resultCount)
        
    }
    const resultCountMob = document.querySelector(".result-countmob");
    if (resultCountMob) {
      resultCountMob.textContent = `${Math.min(
            currentPage * productsPerPage,
            filteredProducts.length
        )} products`;
    }

 
    if (loadMoreButton) {
        if (end >= filteredProducts.length) {
            loadMoreButton.style.display = "none";
        } else {
            loadMoreButton.style.display = "flex";
        }
    }
};

  const filterProducts = () => {
    const desktopCheckboxes = document.querySelectorAll(
      '.men-filter input[type="checkbox"]'
    );
    const drawerCheckboxes = document.querySelectorAll(
      '#menu input[type="checkbox"]'
    );
    const selectedCategories = Array.from(desktopCheckboxes)
      .concat(Array.from(drawerCheckboxes))
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    if (selectedCategories.length > 0) {
      filteredProducts = allProducts.filter((product) =>
        selectedCategories.includes(product.category)
      );
    } else {
      filteredProducts = allProducts;
    }

    currentPage = 1;
    const productsList = document.querySelector(".products-list");
    productsList.innerHTML = "";
    updateContent();
  };

  const sortProducts = () => {
    switch (sortDirection) {
      case "asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
    }

    currentPage = 1;
    const productsList = document.querySelector(".products-list");
    productsList.innerHTML = "";
    updateContent();
  };

  const clearAllFilters = () => {
    const desktopCheckboxes = document.querySelectorAll(
      '.men-filter input[type="checkbox"]'
    );
    const drawerCheckboxes = document.querySelectorAll(
      '#menu input[type="checkbox"]'
    );

    desktopCheckboxes.forEach((checkbox) => (checkbox.checked = false));
    drawerCheckboxes.forEach((checkbox) => (checkbox.checked = false));

    filterProducts();
  };

  const mobSortAsc = document.querySelector(
    '.mob-sort-img[src*="arrow-up.svg"]'
  );
  const mobSortDesc = document.querySelector(
    '.mob-sort-img[src*="arrow-down.svg"]'
  );

  if (mobSortAsc) {
    mobSortAsc.addEventListener("click", () => {
      sortDirection = "asc";
      sortProducts();
    });
  }

  if (mobSortDesc) {
    mobSortDesc.addEventListener("click", () => {
      sortDirection = "desc";
      sortProducts();
    });
  }

  const desktopCheckboxes = document.querySelectorAll(
    '.men-filter input[type="checkbox"]'
  );
  desktopCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", filterProducts);
  });

  const drawerCheckboxes = document.querySelectorAll(
    '#menu input[type="checkbox"]'
  );
  drawerCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", filterProducts);
  });

 

  const clearAllButton = document.querySelector(".underline");
  if (clearAllButton) {
    clearAllButton.addEventListener("click", clearAllFilters);
  }

  const menu = document.querySelector("#menu");
  const drawerOpenButton = document.querySelector("#menuOpen");
  const drawerCloseButton = document.querySelector("#drawerClose");

  if (drawerOpenButton) {
    drawerOpenButton.addEventListener("click", () => {
      if (window.innerWidth <= 320) {
        menu.classList.add("open");
      }
    });
  }

  if (drawerCloseButton) {
    drawerCloseButton.addEventListener("click", () => {
      menu.classList.remove("open");
    });
  }

  await fetchProducts();
  loadMoreButton = document.querySelector("#load-more");
  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", loadMoreProducts);
  }
});
