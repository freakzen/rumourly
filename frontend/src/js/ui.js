    // Additional UI interactions and animations
function initUI() {
    // Animate metric bars on scroll into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const metricFill = entry.target.querySelector('.metric-fill');
                const width = metricFill.style.width;
                metricFill.style.width = '0';
                setTimeout(() => {
                    metricFill.style.width = width;
                }, 100);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.metric').forEach(metric => {
        observer.observe(metric);
    });
    
    // Add click effect to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add ripple effect CSS dynamically
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 600ms linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}