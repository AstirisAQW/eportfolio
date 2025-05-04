document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Window management
    const windowContainer = document.getElementById('window-container');
    const windowTemplate = document.getElementById('window-template');
    const openWindows = new Set();
    let activeWindow = null;
    let windowPositions = {};
    let zIndex = 10;
    
    // Page templates
    const pageTemplates = {
      about: document.getElementById('about-template').content,
      skills: document.getElementById('skills-template').content,
      projects: document.getElementById('projects-template').content,
      contact: document.getElementById('contact-template').content
    };
    
    // Navbar button click handlers
    document.querySelectorAll('.navbar-button').forEach(button => {
      button.addEventListener('click', function() {
        const pageId = this.dataset.page;
        toggleWindow(pageId);
      });
    });
    
    // Toggle window open/close
    function toggleWindow(pageId) {
      if (openWindows.has(pageId)) {
        closeWindow(pageId);
      } else {
        openWindow(pageId);
      }
    }
    
    // Open a new window
    function openWindow(pageId) {
      if (openWindows.has(pageId)) {
        bringToFront(pageId);
        return;
      }
      
      const windowClone = windowTemplate.content.cloneNode(true);
      const windowElement = windowClone.querySelector('.window');
      const windowTitle = windowClone.querySelector('.window-title');
      const windowContent = windowClone.querySelector('.window-content');
      
      // Set window ID and title
      windowElement.id = `window-${pageId}`;
      windowTitle.textContent = getWindowTitle(pageId);
      
      // Add page content
      const pageContent = pageTemplates[pageId].cloneNode(true);
      windowContent.appendChild(pageContent);
      
      // Set initial position
      const initialPos = getInitialPosition(pageId);
      windowElement.style.left = `${initialPos.x}px`;
      windowElement.style.top = `${initialPos.y}px`;
      
      // Add to DOM
      windowContainer.appendChild(windowElement);
      
      // Make it active
      makeActive(windowElement);
      openWindows.add(pageId);
      
      // Setup interact.js for dragging and resizing
      setupInteract(windowElement);
      
      // Setup event listeners for window controls
      setupWindowControls(windowElement, pageId);
      
      // Update navbar button state
      updateNavButton(pageId, true);
      
      // Setup any dynamic content interactions
      setupContentInteractions(windowElement);
    }
    
    // Close a window
    function closeWindow(pageId) {
      const windowElement = document.getElementById(`window-${pageId}`);
      if (windowElement) {
        windowElement.remove();
        openWindows.delete(pageId);
        
        // Update navbar button state
        updateNavButton(pageId, false);
        
        // If we closed the active window, activate another one if available
        if (activeWindow && activeWindow.id === `window-${pageId}`) {
          activeWindow = null;
          if (openWindows.size > 0) {
            const lastWindowId = Array.from(openWindows).pop();
            const lastWindow = document.getElementById(`window-${lastWindowId}`);
            if (lastWindow) makeActive(lastWindow);
          }
        }
      }
    }
    
    // Bring window to front
    function bringToFront(pageId) {
      const windowElement = document.getElementById(`window-${pageId}`);
      if (windowElement) {
        makeActive(windowElement);
      }
    }
    
    // Make a window active
    function makeActive(windowElement) {
      if (activeWindow) {
        activeWindow.classList.remove('active');
        activeWindow.style.zIndex = zIndex++;
      }
      
      windowElement.classList.add('active');
      windowElement.style.zIndex = zIndex++;
      activeWindow = windowElement;
    }
    
    // Get initial position for a window
    function getInitialPosition(pageId) {
      if (windowPositions[pageId]) {
        return windowPositions[pageId];
      }
      
      // Calculate a cascading position for new windows
      const offset = Object.keys(windowPositions).length * 30;
      const newPosition = { x: 50 + offset, y: 50 + offset };
      
      // Update positions
      windowPositions[pageId] = newPosition;
      
      return newPosition;
    }
    
    // Get window title based on page ID
    function getWindowTitle(pageId) {
      const titles = {
        about: 'About Me',
        skills: 'Skills',
        projects: 'Projects',
        contact: 'Contact'
      };
      return titles[pageId] || 'Window';
    }
    
    // Update navbar button active state
    function updateNavButton(pageId, isActive) {
      const button = document.querySelector(`.navbar-button[data-page="${pageId}"]`);
      if (button) {
        if (isActive) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    }
    
    // Setup interact.js for dragging and resizing
    function setupInteract(windowElement) {
      interact(windowElement)
        .draggable({
          allowFrom: '.window-titlebar',
          inertia: true,
          modifiers: [
            interact.modifiers.restrictRect({
              restriction: 'parent',
              endOnly: true
            })
          ],
          listeners: {
            start: function(event) {
              makeActive(windowElement);
            },
            move: function(event) {
              const target = event.target;
              const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
              const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
              
              target.style.transform = `translate(${x}px, ${y}px)`;
              target.setAttribute('data-x', x);
              target.setAttribute('data-y', y);
              
              // Update position in our tracking object
              const pageId = target.id.replace('window-', '');
              if (pageId && windowPositions[pageId]) {
                const computedStyle = window.getComputedStyle(target);
                windowPositions[pageId] = {
                  x: parseFloat(computedStyle.left) + x,
                  y: parseFloat(computedStyle.top) + y
                };
              }
            }
          }
        })
        .resizable({
          edges: { left: true, right: true, bottom: true, top: true },
          listeners: {
            move: function(event) {
              const target = event.target;
              let x = parseFloat(target.getAttribute('data-x')) || 0;
              let y = parseFloat(target.getAttribute('data-y')) || 0;
              
              // Update width and height
              target.style.width = event.rect.width + 'px';
              target.style.height = event.rect.height + 'px';
              
              // Adjust position for resizing from top or left
              x += event.deltaRect.left;
              y += event.deltaRect.top;
              
              target.style.transform = `translate(${x}px, ${y}px)`;
              target.setAttribute('data-x', x);
              target.setAttribute('data-y', y);
            }
          },
          modifiers: [
            interact.modifiers.restrictEdges({
              outer: 'parent'
            }),
            interact.modifiers.restrictSize({
              min: { width: 320, height: 240 }
            })
          ]
        });
    }
    
    // Setup window control buttons
    function setupWindowControls(windowElement, pageId) {
      const closeBtn = windowElement.querySelector('.window-control.close');
      const maximizeBtn = windowElement.querySelector('.window-control.maximize');
      
      closeBtn.addEventListener('click', () => closeWindow(pageId));
      
      maximizeBtn.addEventListener('click', () => {
        const containerRect = windowContainer.getBoundingClientRect();
        
        windowElement.style.width = `${containerRect.width}px`;
        windowElement.style.height = `${containerRect.height}px`;
        windowElement.style.left = '0';
        windowElement.style.top = '0';
        windowElement.style.transform = 'translate(0, 0)';
        windowElement.setAttribute('data-x', 0);
        windowElement.setAttribute('data-y', 0);
        
        // Update position in our tracking object
        windowPositions[pageId] = { x: 0, y: 0 };
      });
      
      // Make window active when clicked anywhere
      windowElement.addEventListener('mousedown', () => {
        makeActive(windowElement);
      });
    }
    
    // Setup any dynamic content interactions
    function setupContentInteractions(windowElement) {
      // Handle GitHub buttons in projects
      windowElement.querySelectorAll('.btn[data-link]').forEach(btn => {
        btn.addEventListener('click', () => {
          window.open(btn.dataset.link, '_blank', 'noopener,noreferrer');
        });
      });
      
      // Handle external links
      windowElement.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
      });
    }
    
    // Open about window by default
    openWindow('about');
  });