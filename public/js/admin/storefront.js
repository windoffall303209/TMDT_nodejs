function initWebsiteManagement() {
    const root = document.querySelector('[data-website-management]');
    if (!root) return;

    const menu = root.querySelector('[data-website-menu]');
    const panels = Array.from(root.querySelectorAll('[data-website-section]'));

    const showSection = (sectionKey) => {
        const hasSection = panels.some((panel) => panel.dataset.websiteSection === sectionKey);
        menu.hidden = hasSection;
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.websiteSection !== sectionKey;
        });
    };

    root.querySelectorAll('[data-website-section-target]').forEach((button) => {
        button.addEventListener('click', () => {
            showSection(button.dataset.websiteSectionTarget);
        });
    });

    root.querySelectorAll('[data-website-back]').forEach((button) => {
        button.addEventListener('click', () => {
            menu.hidden = false;
            panels.forEach((panel) => {
                panel.hidden = true;
            });
        });
    });

    if (root.dataset.activeSection) {
        showSection(root.dataset.activeSection);
    }
}

document.addEventListener('DOMContentLoaded', initWebsiteManagement);
