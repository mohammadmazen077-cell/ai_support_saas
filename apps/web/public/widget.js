(function () {
    // 1. Get configuration
    const script = document.currentScript;
    const businessId = script.getAttribute('data-business-id');

    if (!businessId) {
        console.error('AI Support Widget: Missing data-business-id attribute');
        return;
    }

    // 2. Create UI Elements
    // Container for everything
    const container = document.createElement('div');
    container.id = 'ai-support-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    container.style.gap = '12px';
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Iframe (Chat Window)
    const iframe = document.createElement('iframe');
    iframe.src = `${new URL(script.src).origin}/widget/chat?business_id=${businessId}`;
    iframe.style.width = '350px';
    iframe.style.height = '500px'; // 500px might get cut off
    iframe.style.maxHeight = 'calc(100vh - 100px)';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    iframe.style.display = 'none'; // Hidden by default
    iframe.style.backgroundColor = 'white';
    iframe.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(20px)';

    // Toggle Button
    const button = document.createElement('div');
    button.style.width = '56px';
    button.style.height = '56px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#4F46E5'; // Indigo 600
    button.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.transition = 'transform 0.2s ease';

    // Icon (Chat bubble)
    button.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0791 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37583 5.27072 7.03339C6.10083 5.69096 7.28825 4.60636 8.70012 3.90072C10.112 3.19509 11.693 2.89679 13.2644 3.03964C14.8359 3.18249 16.3356 3.76082 17.5937 4.70637C18.8518 5.65191 19.8184 6.92629 20.3838 8.38466C20.9493 9.84302 21.0917 11.4272 20.7947 12.9568C20.4977 14.4864 19.7731 15.8996 18.7032 17.0355" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    // 3. Logic
    let isOpen = false;

    button.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            // Small delay to allow display:block to apply before transitioning opacity
            setTimeout(() => {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0)';
            }, 10);

            // Allow close icon
            button.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(20px)';
            setTimeout(() => {
                iframe.style.display = 'none';
            }, 300);

            // Restore chat icon
            button.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0791 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37583 5.27072 7.03339C6.10083 5.69096 7.28825 4.60636 8.70012 3.90072C10.112 3.19509 11.693 2.89679 13.2644 3.03964C14.8359 3.18249 16.3356 3.76082 17.5937 4.70637C18.8518 5.65191 19.8184 6.92629 20.3838 8.38466C20.9493 9.84302 21.0917 11.4272 20.7947 12.9568C20.4977 14.4864 19.7731 15.8996 18.7032 17.0355" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
    });

    // 4. Inject
    container.appendChild(iframe);
    container.appendChild(button);
    document.body.appendChild(container);
})();
