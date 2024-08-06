describe('Product Page', () => {
  beforeEach(() => {
      // Visit the page before each test
      
      cy.visit('http://127.0.0.1:5501/index.html'); 
  });

  it('should display the page title', () => {
      cy.title().should('include', 'Product Page'); // Replace 'Your Page Title' with the actual page title
  });

  it('should load the product list', () => {
      cy.get('.products-list').should('exist'); // Check if the product list container exists
  });

  it('should display the "Load More" button if there are more products', () => {
      cy.get('#load-more').should('exist'); // Check if the "Load More" button exists
  });

  it('should open and close the modal', () => {
    cy.viewport(320, 800);
      cy.get('#openModalButton').click(); // Click the button to open the modal
      cy.get('#myModal').should('be.visible'); // Check if the modal is visible

      cy.get('.close').click(); // Click the close button
      cy.get('#myModal').should('not.be.visible'); // Check if the modal is closed
  });

  it('should perform a search and filter products', () => {
      cy.get('#search-products').type('Mens Cotton Jacket'); // Type into the search box
      cy.get('.product-box').should('contain', 'Mens Cotton Jacket'); // Check if filtered products contain the search term
  });

  it('should handle sorting by price', () => {
      cy.get('#sort-select').select('Price: Low to High'); // Select ascending price sort option
      cy.get('#sort-select').first().should('contain', 'Price: Low to High'); // Check if the first product is the lowest priced one
  });
});