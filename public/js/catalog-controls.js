const catalogState = window.__catalogControlsState || (window.__catalogControlsState = {
    initialized: false,
    abortController: null,
    sidebarUpdateTimer: null
});

function getCatalogPageElements(root = document) {
    const container = root.querySelector('[data-catalog-container]');
    const page = root.querySelector('.catalog-page');

    return {
        container,
        page
    };
}

function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function buildCatalogFormUrl(form) {
    const action = form.getAttribute('action') || window.location.pathname;
    const url = new URL(action, window.location.origin);
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
        if (value === undefined || value === null || value === '') {
            continue;
        }

        url.searchParams.append(key, String(value));
    }

    return url.toString();
}

function clearPendingSidebarUpdate() {
    if (!catalogState.sidebarUpdateTimer) {
        return;
    }

    window.clearTimeout(catalogState.sidebarUpdateTimer);
    catalogState.sidebarUpdateTimer = null;
}

function scheduleSidebarCatalogUpdate(url, options = {}) {
    clearPendingSidebarUpdate();
    catalogState.sidebarUpdateTimer = window.setTimeout(() => {
        catalogState.sidebarUpdateTimer = null;
        loadCatalogContent(url, options);
    }, 120);
}

function setCatalogLoadingState(isLoading) {
    const { page } = getCatalogPageElements(document);
    if (!page) {
        return;
    }

    page.classList.toggle('is-updating', Boolean(isLoading));
}

function getOpenCatalogTreeIds(root = document) {
    return [...root.querySelectorAll('[data-catalog-tree-toggle].is-open')]
        .map((button) => button.getAttribute('aria-controls'))
        .filter(Boolean);
}

function restoreCatalogTreeState(openTreeIds = [], root = document) {
    const openTreeIdSet = new Set(
        (Array.isArray(openTreeIds) ? openTreeIds : []).map((item) => String(item))
    );

    root.querySelectorAll('[data-catalog-tree-toggle]').forEach((button) => {
        const targetId = button.getAttribute('aria-controls');
        if (!targetId) {
            return;
        }

        const isOpen = openTreeIdSet.has(String(targetId));
        const target = document.getElementById(targetId);

        button.classList.toggle('is-open', isOpen);
        button.setAttribute('aria-expanded', String(isOpen));
        target?.classList.toggle('is-open', isOpen);
    });
}

function replaceCatalogContent(container, nextContainer, replaceMode = 'container') {
    if (replaceMode !== 'results') {
        container.innerHTML = nextContainer.innerHTML;
        return 'container';
    }

    const currentIntro = container.querySelector('.catalog-intro');
    const nextIntro = nextContainer.querySelector('.catalog-intro');
    const currentResults = container.querySelector('.catalog-results');
    const nextResults = nextContainer.querySelector('.catalog-results');

    if (!currentIntro || !nextIntro || !currentResults || !nextResults) {
        container.innerHTML = nextContainer.innerHTML;
        return 'container';
    }

    currentIntro.replaceWith(nextIntro.cloneNode(true));
    currentResults.replaceWith(nextResults.cloneNode(true));

    return 'results';
}

async function loadCatalogContent(url, options = {}) {
    const {
        updateHistory = true,
        preserveWindowScroll = true,
        replaceMode = 'container'
    } = options;

    const { container } = getCatalogPageElements(document);
    if (!container) {
        window.location.assign(url);
        return;
    }

    clearPendingSidebarUpdate();

    const currentSidebarPanel = document.querySelector('.catalog-sidebar__panel');
    const currentSidebar = document.getElementById('catalogSidebar');
    const savedSidebarScroll = currentSidebarPanel?.scrollTop || 0;
    const savedWindowScroll = window.scrollY;
    const savedSidebarOpen = currentSidebar?.classList.contains('is-open') || false;
    const savedOpenTreeIds = getOpenCatalogTreeIds(document);

    if (catalogState.abortController) {
        catalogState.abortController.abort();
    }

    const abortController = new AbortController();
    catalogState.abortController = abortController;
    setCatalogLoadingState(true);

    try {
        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'fetch',
                Accept: 'text/html,application/xhtml+xml'
            },
            signal: abortController.signal
        });

        if (!response.ok) {
            throw new Error(`Catalog request failed: ${response.status}`);
        }

        const html = await response.text();
        const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
        const nextContainer = parsedDocument.querySelector('[data-catalog-container]');

        if (!nextContainer) {
            throw new Error('Catalog container not found in response');
        }

        const appliedReplaceMode = replaceCatalogContent(container, nextContainer, replaceMode);
        document.title = parsedDocument.title || document.title;

        if (updateHistory) {
            window.history.pushState({ catalog: true }, '', url);
        }

        if (preserveWindowScroll) {
            window.scrollTo({ top: savedWindowScroll, behavior: 'auto' });
        }

        initializeCatalogControls(document);

        if (appliedReplaceMode === 'container') {
            const newSidebar = document.getElementById('catalogSidebar');
            const newSidebarToggle = document.querySelector('[data-catalog-filter-toggle]');
            const newSidebarPanel = document.querySelector('.catalog-sidebar__panel');

            if (savedSidebarOpen && newSidebar && newSidebarToggle) {
                newSidebar.classList.add('is-open');
                newSidebarToggle.setAttribute('aria-expanded', 'true');
            }

            restoreCatalogTreeState(savedOpenTreeIds, document);

            if (newSidebarPanel) {
                newSidebarPanel.scrollTop = savedSidebarScroll;
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            return;
        }

        console.error('Catalog update error:', error);
        window.location.assign(url);
    } finally {
        if (catalogState.abortController === abortController) {
            catalogState.abortController = null;
            setCatalogLoadingState(false);
        }
    }
}

function bindCatalogToolbarForms(root = document) {
    const toolbarForms = root.querySelectorAll('.catalog-toolbar__form');

    toolbarForms.forEach((form) => {
        if (!form || form.dataset.catalogControlsBound === 'true') {
            return;
        }

        form.dataset.catalogControlsBound = 'true';

        const pageInput = form.querySelector('input[name="page"]');
        const controls = form.querySelectorAll('select[data-catalog-control]');

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            loadCatalogContent(buildCatalogFormUrl(form));
        });

        controls.forEach((control) => {
            control.addEventListener('change', () => {
                if (pageInput) {
                    pageInput.value = '1';
                }

                loadCatalogContent(buildCatalogFormUrl(form));
            });
        });
    });
}

function bindCatalogSidebar(root = document) {
    const sidebar = root.querySelector('#catalogSidebar');
    const sidebarToggle = root.querySelector('[data-catalog-filter-toggle]');
    const sidebarForm = sidebar?.querySelector('.catalog-sidebar__form') || null;
    const treeToggleButtons = root.querySelectorAll('[data-catalog-tree-toggle]');
    const autoSubmitInputs = sidebarForm?.querySelectorAll('[data-auto-submit-filter]') || [];

    if (sidebar && sidebarToggle && sidebarToggle.dataset.catalogControlsBound !== 'true') {
        sidebarToggle.dataset.catalogControlsBound = 'true';
        sidebarToggle.addEventListener('click', () => {
            const isOpen = !sidebar.classList.contains('is-open');
            sidebar.classList.toggle('is-open', isOpen);
            sidebarToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    treeToggleButtons.forEach((button) => {
        if (button.dataset.catalogControlsBound === 'true') {
            return;
        }

        button.dataset.catalogControlsBound = 'true';
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('aria-controls');
            const target = targetId ? document.getElementById(targetId) : null;
            const isOpen = !button.classList.contains('is-open');

            button.classList.toggle('is-open', isOpen);
            button.setAttribute('aria-expanded', String(isOpen));
            target?.classList.toggle('is-open', isOpen);
        });
    });

    if (sidebarForm && sidebarForm.dataset.catalogControlsBound !== 'true') {
        sidebarForm.dataset.catalogControlsBound = 'true';

        sidebarForm.addEventListener('submit', (event) => {
            event.preventDefault();
            loadCatalogContent(buildCatalogFormUrl(sidebarForm), {
                replaceMode: 'results'
            });
        });

        const pageInput = sidebarForm.querySelector('input[name="page"]');

        autoSubmitInputs.forEach((input) => {
            if (!input || input.dataset.catalogControlsBound === 'true') {
                return;
            }

            input.dataset.catalogControlsBound = 'true';
            input.addEventListener('change', () => {
                if (pageInput) {
                    pageInput.value = '1';
                }

                scheduleSidebarCatalogUpdate(buildCatalogFormUrl(sidebarForm), {
                    replaceMode: 'results'
                });
            });
        });
    }
}

function bindCatalogLinks(root = document) {
    const ajaxLinks = root.querySelectorAll('.catalog-pagination a, .catalog-sidebar__reset, .catalog-sidebar__all-link');

    ajaxLinks.forEach((link) => {
        if (!link || link.dataset.catalogControlsBound === 'true') {
            return;
        }

        link.dataset.catalogControlsBound = 'true';
        link.addEventListener('click', (event) => {
            if (isModifiedClick(event)) {
                return;
            }

            const href = link.getAttribute('href');
            if (!href) {
                return;
            }

            event.preventDefault();
            loadCatalogContent(new URL(href, window.location.origin).toString());
        });
    });
}

function initializeCatalogControls(root = document) {
    const { container } = getCatalogPageElements(root);
    if (!container) {
        return;
    }

    bindCatalogToolbarForms(root);
    bindCatalogSidebar(root);
    bindCatalogLinks(root);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCatalogControls(document);

    if (!catalogState.initialized) {
        catalogState.initialized = true;

        window.addEventListener('popstate', () => {
            if (document.querySelector('[data-catalog-container]')) {
                loadCatalogContent(window.location.href, {
                    updateHistory: false
                });
            }
        });
    }
});
