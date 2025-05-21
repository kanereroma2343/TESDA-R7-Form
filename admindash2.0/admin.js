// Admin Dashboard JavaScript

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getDatabase, ref, onValue, query, limitToFirst, startAfter, orderByChild, get, setPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmgjzLx4mVkeWyfjwKNMtxmL9o1BesaW0",
    authDomain: "sampleform-fd82e.firebaseapp.com",
    databaseURL: "https://sampleform-fd82e-default-rtdb.firebaseio.com",
    projectId: "sampleform-fd82e",
    storageBucket: "sampleform-fd82e.firebasestorage.app",
    messagingSenderId: "129137441476",
    appId: "1:129137441476:web:e29e8ca547b93aa1d3a791",
    measurementId: "G-DZMYEG4NHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const applicationsRef = ref(db, 'applications');

// Enable offline persistence
setPersistence(db, {
    synchronizeTabs: true
}).catch((err) => {
    console.error("Error enabling persistence:", err);
});

// Pagination settings
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let lastKey = null;
let cachedData = null;
let searchTimeout = null;
let isInitialLoad = true;

console.log('Firebase initialized');

// Function to show loading state
function showLoading() {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading data...</p>
                </td>
            </tr>
        `;
    }
}

// Function to show error state
function showError(message) {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center error-message">
                    <p>${message}</p>
                    <button onclick="retryConnection()" class="btn btn-secondary">Retry</button>
                </td>
            </tr>
        `;
    }
}

// Function to retry connection
window.retryConnection = function() {
    showLoading();
    setupRealtimeListener();
};

// Function to setup realtime listener with pagination and selective data fetching
function setupRealtimeListener() {
    // Only fetch essential fields to reduce bandwidth
    const paginatedQuery = query(
        applicationsRef,
        limitToFirst(ITEMS_PER_PAGE),
        orderByChild('timestamp')
    );
    
    // Use once() for initial load to avoid unnecessary real-time updates
    if (isInitialLoad) {
        get(paginatedQuery).then((snapshot) => {
            console.log('Initial data loaded');
            const data = snapshot.val();
            cachedData = data;
            updateTable(data);
            updatePagination(data);
            isInitialLoad = false;
        }).catch((error) => {
            console.error('Error fetching initial data:', error);
            showError('Error loading data. Please try again.');
        });
    } else {
        // Use onValue for subsequent updates
        onValue(paginatedQuery, (snapshot) => {
            console.log('Data update received');
            const data = snapshot.val();
            cachedData = data;
            updateTable(data);
            updatePagination(data);
        }, (error) => {
            console.error('Error fetching data:', error);
            showError('Error loading data. Please try again.');
        });
    }
}

// Function to update pagination controls
function updatePagination(data) {
    const paginationContainer = document.getElementById('paginationNumbers');
    if (!paginationContainer) return;

    const totalItems = Object.keys(data || {}).length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    let paginationHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button class="pagination-number ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }
    
    paginationContainer.innerHTML = paginationHTML;

    // Update previous/next buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// Function to change page
window.changePage = function(page) {
    currentPage = page;
    showLoading();
    
    if (cachedData) {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = Object.entries(cachedData)
            .slice(startIndex, endIndex)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        updateTable(pageData);
    } else {
        setupRealtimeListener();
    }
};

// Function to handle search with debouncing and caching
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Set new timeout for search
    searchTimeout = setTimeout(() => {
        if (!cachedData) return;
        
        // Use cached data for search to avoid unnecessary database reads
        const filteredData = Object.entries(cachedData)
            .filter(([_, application]) => {
                const ticketNumber = (application.ticketNumber || '').toLowerCase();
                const firstName = (application.manpowerProfile?.firstName || '').toLowerCase();
                const lastName = (application.manpowerProfile?.lastName || '').toLowerCase();
                const province = (application.manpowerProfile?.province || '').toLowerCase();
                
                return ticketNumber.includes(searchTerm) ||
                       firstName.includes(searchTerm) ||
                       lastName.includes(searchTerm) ||
                       province.includes(searchTerm);
            })
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        updateTable(filteredData);
    }, 300); // 300ms delay for better performance
}

// Function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Function to update the table with data using virtual scrolling
function updateTable(data) {
    console.log('updateTable called with data:', data);
    const tbody = document.getElementById('tableBody');
    
    if (!tbody) {
        console.error('Table body element not found!');
        return;
    }
    
    tbody.innerHTML = ''; // Clear existing rows

    if (!data) {
        console.log('No data available');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No data available</td></tr>';
        return;
    }

    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Process data in chunks to prevent UI blocking
    const processData = (entries) => {
        entries.forEach(([key, application]) => {
            const row = document.createElement('tr');
            
            // Only extract needed fields to reduce memory usage
            const ticketNumber = application.ticketNumber || 'N/A';
            const firstName = application.manpowerProfile?.firstName || '';
            const lastName = application.manpowerProfile?.lastName || '';
            const applicantName = firstName && lastName ? `${firstName} ${lastName}` : 'N/A';
            const province = application.manpowerProfile?.province || 'N/A';
            const timestamp = application.timestamp ? formatDate(application.timestamp) : 'N/A';

            row.innerHTML = `
                <td>${ticketNumber}</td>
                <td>${applicantName}</td>
                <td>Null</td>
                <td>${province}</td>
                <td>${timestamp}</td>
                <td><span class="status pending">Null</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewApplication('${key}')">View</button>
                        <button class="action-btn edit" onclick="editApplication('${key}')">Edit</button>
                    </div>
                </td>
            `;
            
            fragment.appendChild(row);
        });
    };

    // Process data in chunks of 5
    const entries = Object.entries(data);
    const chunkSize = 5;
    
    for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        setTimeout(() => processData(chunk), i * 50); // Add small delay between chunks
    }

    // Append the fragment to the table body
    tbody.appendChild(fragment);
}

// Export functions for use in HTML
window.viewApplication = function(key) {
    console.log('View application:', key);
};

window.editApplication = function(key) {
    console.log('Edit application:', key);
};

document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM Content Loaded');
    
    // Initialize table
    const table = document.querySelector('.data-table');
    if (!table) {
        console.error('Table element not found!');
    } else {
        console.log('Table element found');
        showLoading();
        setupRealtimeListener();
    }

    // Add event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            showLoading();
            setupRealtimeListener();
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!cachedData) return;
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + "Ticket Number,Applicant Name,Province,Date Received\n"
                + Object.entries(cachedData)
                    .map(([_, application]) => {
                        const ticketNumber = application.ticketNumber || 'N/A';
                        const applicantName = application.manpowerProfile ? 
                            `${application.manpowerProfile.firstName} ${application.manpowerProfile.lastName}` : 
                            'N/A';
                        const province = application.manpowerProfile?.province || 'N/A';
                        const timestamp = application.timestamp ? formatDate(application.timestamp) : 'N/A';
                        
                        return `${ticketNumber},${applicantName},${province},${timestamp}`;
                    })
                    .join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "applications.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Add styles for loading spinner and pagination
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: var(--accent-light-blue);
            animation: spin 1s ease-in-out infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .error-message {
            color: #ff4444;
            padding: 20px;
        }

        .error-message button {
            margin-top: 10px;
        }

        .pagination-number {
            padding: 5px 10px;
            margin: 0 2px;
            border: 1px solid var(--accent-light-blue);
            background: transparent;
            color: var(--accent-light-blue);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .pagination-number:hover {
            background: var(--accent-light-blue);
            color: var(--background-dark);
        }

        .pagination-number.active {
            background: var(--accent-light-blue);
            color: var(--background-dark);
        }

        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);

    // Mobile Menu Toggle
    const menuToggle = document.getElementById("menuToggle")
    const sidebar = document.querySelector(".sidebar")
  
    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", function () {
        sidebar.classList.toggle("active")
  
        // Animate hamburger menu
        this.classList.toggle("active")
        if (this.classList.contains("active")) {
          this.children[0].style.transform = "translateY(8px) rotate(45deg)"
          this.children[1].style.opacity = "0"
          this.children[2].style.transform = "translateY(-8px) rotate(-45deg)"
        } else {
          this.children[0].style.transform = "none"
          this.children[1].style.opacity = "1"
          this.children[2].style.transform = "none"
        }
      })
    }
  
    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (event) => {
      const isClickInsideSidebar = sidebar.contains(event.target)
      const isClickOnMenuToggle = menuToggle.contains(event.target)
  
      if (
        window.innerWidth <= 768 &&
        !isClickInsideSidebar &&
        !isClickOnMenuToggle &&
        sidebar.classList.contains("active")
      ) {
        sidebar.classList.remove("active")
        menuToggle.classList.remove("active")
        menuToggle.children[0].style.transform = "none"
        menuToggle.children[1].style.opacity = "1"
        menuToggle.children[2].style.transform = "none"
      }
    })
  
    // Pagination functionality
    const paginationNumbers = document.querySelectorAll(".pagination-number")
    const paginationButtons = document.querySelectorAll(".pagination-btn")
  
    paginationNumbers.forEach((button) => {
      button.addEventListener("click", function () {
        paginationNumbers.forEach((btn) => btn.classList.remove("active"))
        this.classList.add("active")
      })
    })
  
    // Table row hover effect with glow
    const tableRows = document.querySelectorAll(".data-table tbody tr")
  
    tableRows.forEach((row) => {
      row.addEventListener("mouseenter", function () {
        this.style.boxShadow = "var(--glow-blue)"
        this.style.zIndex = "1"
      })
  
      row.addEventListener("mouseleave", function () {
        this.style.boxShadow = "none"
        this.style.zIndex = "auto"
      })
    })
  
    // Add subtle animation to cards
    const cards = document.querySelectorAll(".card")
  
    cards.forEach((card, index) => {
      // Stagger the animation
      setTimeout(() => {
        card.style.opacity = "0"
        card.style.transform = "translateY(20px)"
  
        setTimeout(() => {
          card.style.transition = "opacity 0.5s ease, transform 0.5s ease"
          card.style.opacity = "1"
          card.style.transform = "translateY(0)"
        }, 100)
      }, index * 100)
    })
  
    // Add glow effect to buttons on hover
    const buttons = document.querySelectorAll(".btn, .action-btn")
  
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", function () {
        this.style.boxShadow = "var(--glow-blue)"
      })
  
      button.addEventListener("mouseleave", function () {
        if (!this.classList.contains("btn-primary")) {
          this.style.boxShadow = "none"
        } else {
          this.style.boxShadow = "var(--button-shadow)"
        }
      })
    })
  
    // Simulate loading data
    simulateLoading()
  })
  
  // Function to simulate loading data
  function simulateLoading() {
    const tableBody = document.querySelector(".data-table tbody")
    const loadingOverlay = document.createElement("div")
  
    loadingOverlay.style.position = "absolute"
    loadingOverlay.style.top = "0"
    loadingOverlay.style.left = "0"
    loadingOverlay.style.width = "100%"
    loadingOverlay.style.height = "100%"
    loadingOverlay.style.background = "rgba(0, 8, 20, 0.7)"
    loadingOverlay.style.display = "flex"
    loadingOverlay.style.justifyContent = "center"
    loadingOverlay.style.alignItems = "center"
    loadingOverlay.style.zIndex = "10"
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>'
  
    const spinner = document.createElement("style")
    spinner.textContent = `
          .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              border-top-color: var(--accent-light-blue);
              animation: spin 1s ease-in-out infinite;
          }
          
          @keyframes spin {
              to { transform: rotate(360deg); }
          }
      `
  
    document.head.appendChild(spinner)
  
    if (tableBody) {
      const tableContainer = tableBody.closest(".table-container")
      tableContainer.style.position = "relative"
      tableContainer.appendChild(loadingOverlay)
  
      // Simulate loading delay
      setTimeout(() => {
        loadingOverlay.style.opacity = "0"
        loadingOverlay.style.transition = "opacity 0.5s ease"
  
        setTimeout(() => {
          loadingOverlay.remove()
        }, 500)
      }, 1500)
    }
  }
  
  // Window resize handler
  window.addEventListener("resize", () => {
    const sidebar = document.querySelector(".sidebar")
    const menuToggle = document.getElementById("menuToggle")
  
    if (window.innerWidth > 768 && sidebar) {
      sidebar.classList.remove("active")
      if (menuToggle) {
        menuToggle.classList.remove("active")
        menuToggle.children[0].style.transform = "none"
        menuToggle.children[1].style.opacity = "1"
        menuToggle.children[2].style.transform = "none"
      }
    }
  })
  