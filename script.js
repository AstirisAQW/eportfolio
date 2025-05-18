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
    
    // Tiling management
    let tilingMode = 'auto'; // auto, manual
    let tilingLayout = 'split'; // split, quad, stack
    
    // Key combinations for tiling shortcuts
    document.addEventListener('keydown', function(e) {
      // Super+T to toggle tiling mode
      if (e.altKey && e.key === 't') {
        tilingMode = tilingMode === 'auto' ? 'manual' : 'auto';
        if (tilingMode === 'auto') {
          applyTiling();
        }
      }
      
      // Super+1,2,3 to change tiling layout
      if (e.altKey && e.key === '1') {
        tilingLayout = 'split';
        if (tilingMode === 'auto') applyTiling();
      } else if (e.altKey && e.key === '2') {
        tilingLayout = 'quad';
        if (tilingMode === 'auto') applyTiling();
      } else if (e.altKey && e.key === '3') {
        tilingLayout = 'stack';
        if (tilingMode === 'auto') applyTiling();
      }
      
      // Super+F for fullscreen current window
      if (e.altKey && e.key === 'f' && activeWindow) {
        toggleFullscreen(activeWindow);
      }
      
      // Super+arrow keys for tiling current window
      if (e.altKey && activeWindow) {
        if (e.key === 'ArrowLeft') {
          tileWindow(activeWindow, 'left');
        } else if (e.key === 'ArrowRight') {
          tileWindow(activeWindow, 'right');
        } else if (e.key === 'ArrowUp') {
          tileWindow(activeWindow, 'top');
        } else if (e.key === 'ArrowDown') {
          tileWindow(activeWindow, 'bottom');
        }
      }
    });
    
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
      
      // Apply tiling if in auto mode
      if (tilingMode === 'auto') {
        applyTiling();
      }
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
        
        // Apply tiling if in auto mode
        if (tilingMode === 'auto') {
          applyTiling();
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
              // Switch to manual mode when user starts dragging
              if (tilingMode === 'auto') {
                removeAllTilingClasses(windowElement);
              }
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
            },
            end: function(event) {
              // Check if window should snap to an edge
              if (tilingMode === 'auto') {
                const rect = windowElement.getBoundingClientRect();
                const containerRect = windowContainer.getBoundingClientRect();
                
                // Detect proximity to edges and snap
                if (rect.right >= containerRect.right - 20) {
                  tileWindow(windowElement, 'right');
                } else if (rect.left <= containerRect.left + 20) {
                  tileWindow(windowElement, 'left');
                } else if (rect.top <= containerRect.top + 20) {
                  tileWindow(windowElement, 'top');
                } else if (rect.bottom >= containerRect.bottom - 20) {
                  tileWindow(windowElement, 'bottom');
                }
              }
            }
          }
        })
        .resizable({
          edges: { left: true, right: true, bottom: true, top: true },
          listeners: {
            start: function(event) {
              makeActive(windowElement);
              // Switch to manual mode when user starts resizing
              if (tilingMode === 'auto') {
                removeAllTilingClasses(windowElement);
              }
            },
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
      const minimizeBtn = windowElement.querySelector('.window-control.minimize');
      
      closeBtn.addEventListener('click', () => closeWindow(pageId));
      
      maximizeBtn.addEventListener('click', () => {
        toggleFullscreen(windowElement);
      });
      
      minimizeBtn.addEventListener('click', () => {
        toggleMinimize(windowElement);
      });
      
      // Make window active when clicked anywhere
      windowElement.addEventListener('mousedown', () => {
        makeActive(windowElement);
      });
      
      // Double click on titlebar to maximize
      const titlebar = windowElement.querySelector('.window-titlebar');
      titlebar.addEventListener('dblclick', () => {
        toggleFullscreen(windowElement);
      });
    }
    
    // Toggle fullscreen state of a window
    function toggleFullscreen(windowElement) {
      if (windowElement.classList.contains('tiled-fullscreen')) {
        removeAllTilingClasses(windowElement);
        if (tilingMode === 'auto') {
          applyTiling();
        }
      } else {
        removeAllTilingClasses(windowElement);
        windowElement.classList.add('tiled');
        windowElement.classList.add('tiled-fullscreen');
      }
    }
    
    // Toggle minimize state of a window
    function toggleMinimize(windowElement) {
      if (windowElement.classList.contains('minimized')) {
        // Restore window to its previous state
        windowElement.classList.remove('minimized');
        
        // If it was previously tiled, keep it tiled
        const isTiled = windowElement.classList.contains('tiled');
        if (!isTiled && tilingMode === 'auto') {
          applyTiling();
        }
      } else {
        // Store current position and size for later restoration
        const rect = windowElement.getBoundingClientRect();
        windowElement.setAttribute('data-restore-width', rect.width);
        windowElement.setAttribute('data-restore-height', rect.height);
        windowElement.setAttribute('data-restore-left', windowElement.style.left);
        windowElement.setAttribute('data-restore-top', windowElement.style.top);
        windowElement.setAttribute('data-restore-transform', windowElement.style.transform);
        
        // Minimize the window
        windowElement.classList.add('minimized');
        windowElement.style.transform = 'translate(0, 0)';
        windowElement.style.height = '32px';
        windowElement.style.width = '200px';
        windowElement.style.left = '0';
        windowElement.style.bottom = '0';
        windowElement.style.top = 'auto';
        
        // Arrange minimized windows neatly
        const minimizedWindows = Array.from(document.querySelectorAll('.window.minimized'));
        const index = minimizedWindows.indexOf(windowElement);
        if (index > 0) {
          windowElement.style.left = (index * 210) + 'px';
        }
      }
    }
    
    // Tile a window to a specific position
    function tileWindow(windowElement, position) {
      removeAllTilingClasses(windowElement);
      windowElement.classList.add('tiled');
      
      switch(position) {
        case 'left':
          windowElement.classList.add('tiled-left');
          break;
        case 'right':
          windowElement.classList.add('tiled-right');
          break;
        case 'top':
          windowElement.classList.add('tiled-top');
          break;
        case 'bottom':
          windowElement.classList.add('tiled-bottom');
          break;
        case 'top-left':
          windowElement.classList.add('tiled-top-left');
          break;
        case 'top-right':
          windowElement.classList.add('tiled-top-right');
          break;
        case 'bottom-left':
          windowElement.classList.add('tiled-bottom-left');
          break;
        case 'bottom-right':
          windowElement.classList.add('tiled-bottom-right');
          break;
      }
      
      // Reset transform and position attributes
      windowElement.style.transform = 'none';
      windowElement.setAttribute('data-x', 0);
      windowElement.setAttribute('data-y', 0);
    }
    
    // Remove all tiling classes from a window
    function removeAllTilingClasses(windowElement) {
      windowElement.classList.remove('tiled');
      windowElement.classList.remove('tiled-left');
      windowElement.classList.remove('tiled-right');
      windowElement.classList.remove('tiled-top');
      windowElement.classList.remove('tiled-bottom');
      windowElement.classList.remove('tiled-top-left');
      windowElement.classList.remove('tiled-top-right');
      windowElement.classList.remove('tiled-bottom-left');
      windowElement.classList.remove('tiled-bottom-right');
      windowElement.classList.remove('tiled-fullscreen');
    }
    
    // Apply tiling layout to all windows
    function applyTiling() {
      const windows = Array.from(document.querySelectorAll('.window'));
      const windowCount = windows.length;
      
      if (windowCount === 0) return;
      
      // Reset all tiling classes
      windows.forEach(window => {
        removeAllTilingClasses(window);
        window.classList.add('tiled');
      });
      
      switch(tilingLayout) {
        case 'split':
          applySplitLayout(windows);
          break;
        case 'quad':
          applyQuadLayout(windows);
          break;
        case 'stack':
          applyStackLayout(windows);
          break;
      }
    }
    
    // Apply a split layout (side by side)
    function applySplitLayout(windows) {
      const windowCount = windows.length;
      
      if (windowCount === 1) {
        windows[0].classList.add('tiled-fullscreen');
      } else if (windowCount === 2) {
        windows[0].classList.add('tiled-left');
        windows[1].classList.add('tiled-right');
      } else if (windowCount === 3) {
        windows[0].classList.add('tiled-left');
        windows[1].classList.add('tiled-top-right');
        windows[2].classList.add('tiled-bottom-right');
      } else {
        // For 4 or more windows, use quad layout
        applyQuadLayout(windows);
      }
    }
    
    // Apply a quad layout (4 quadrants)
    function applyQuadLayout(windows) {
      const windowCount = windows.length;
      
      if (windowCount === 1) {
        windows[0].classList.add('tiled-fullscreen');
      } else if (windowCount === 2) {
        windows[0].classList.add('tiled-top');
        windows[1].classList.add('tiled-bottom');
      } else if (windowCount === 3) {
        windows[0].classList.add('tiled-top');
        windows[1].classList.add('tiled-bottom-left');
        windows[2].classList.add('tiled-bottom-right');
      } else {
        // 4 or more windows
        windows[0].classList.add('tiled-top-left');
        windows[1].classList.add('tiled-top-right');
        windows[2].classList.add('tiled-bottom-left');
        windows[3].classList.add('tiled-bottom-right');
        
        // If more than 4 windows, only show the first 4
        if (windowCount > 4) {
          for(let i = 4; i < windowCount; i++) {
            windows[i].style.display = 'none';
          }
        }
      }
    }
    
    // Apply a stack layout (one after another)
    function applyStackLayout(windows) {
      const windowCount = windows.length;
      
      if (windowCount === 1) {
        windows[0].classList.add('tiled-fullscreen');
        return;
      }
      
      // Calculate the height for each window
      const height = 100 / windowCount;
      
      windows.forEach((window, index) => {
        window.style.left = '0';
        window.style.top = `${index * height}%`;
        window.style.width = '100%';
        window.style.height = `${height}%`;
        window.style.transform = 'none';
        window.setAttribute('data-x', 0);
        window.setAttribute('data-y', 0);
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
    
    // Add a tooltip to show tiling shortcuts
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '10px';
    tooltip.style.right = '10px';
    tooltip.style.background = 'rgba(0,0,0,0.7)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1000';
    tooltip.innerHTML = `
      <p>Keyboard Shortcuts:</p>
      <p>Alt+T: Toggle auto tiling</p>
      <p>Alt+1/2/3: Change layout</p>
      <p>Alt+F: Fullscreen</p>
      <p>Alt+Arrows: Tile window</p>
    `;
    document.body.appendChild(tooltip);
  });