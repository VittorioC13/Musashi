// ============================================
// MUSASHI - Interactive Demo Script
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Terminal typing animation (optional - can be enabled)
    function typeWriter(element, text, speed = 50) {
        let i = 0;
        element.innerHTML = '';
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // Animate stats on scroll
    const stats = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    stats.forEach(stat => {
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(20px)';
        stat.style.transition = 'all 0.6s ease-out';
        observer.observe(stat);
    });

    // Add cursor blink effect to terminals
    const terminals = document.querySelectorAll('.terminal-body');
    terminals.forEach(terminal => {
        const lastLine = terminal.lastElementChild;
        if (lastLine && !lastLine.classList.contains('no-cursor')) {
            setInterval(() => {
                if (lastLine.innerHTML.endsWith('_')) {
                    lastLine.innerHTML = lastLine.innerHTML.slice(0, -1);
                } else {
                    lastLine.innerHTML += '_';
                }
            }, 530);
        }
    });

    // Parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero');
        parallaxElements.forEach(el => {
            el.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
    });

    // Konami code easter egg: shows actual API response
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.key);
        konamiCode = konamiCode.slice(-10);

        if (konamiCode.join(',') === konamiSequence.join(',')) {
            showLiveAPIDemo();
        }
    });

    function showLiveAPIDemo() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1e1e1e;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            z-index: 10000;
            max-width: 800px;
            max-height: 80vh;
            overflow: auto;
            color: #d4d4d4;
            font-family: monospace;
        `;

        modal.innerHTML = `
            <h3 style="color: #4ade80; margin-bottom: 1rem;">🎉 LIVE API DEMO</h3>
            <p style="margin-bottom: 1rem;">Fetching real data from Musashi API...</p>
            <pre id="live-response" style="font-size: 0.875rem; line-height: 1.6;">Loading...</pre>
            <button onclick="this.parentElement.remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4ade80; border: none; border-radius: 4px; cursor: pointer; color: #1e1e1e; font-weight: bold;">Close</button>
        `;

        document.body.appendChild(modal);

        // Fetch actual API response
        fetch('https://musashi-api.vercel.app/api/analyze-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Trump immigration deportation policy' })
        })
        .then(r => r.json())
        .then(data => {
            document.getElementById('live-response').textContent = JSON.stringify(data, null, 2);
        })
        .catch(err => {
            document.getElementById('live-response').textContent = 'Error: ' + err.message;
        });
    }

    // Track button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent.trim();
            console.log(`[Musashi] Button clicked: ${action}`);
        });
    });

    console.log('%c🤖 Musashi AI Agent Intelligence', 'font-size: 24px; color: #4ade80; font-weight: bold;');
    console.log('%cBuilt for agents that never sleep 💤💰', 'font-size: 14px; color: #888;');
    console.log('%cTry the Konami code for a surprise! ↑↑↓↓←→←→BA', 'font-size: 12px; color: #666;');
});
