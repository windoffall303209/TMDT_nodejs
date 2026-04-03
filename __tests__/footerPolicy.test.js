process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

describe('footer policy links', () => {
    it('renders policy links and late luxury overrides in the shared footer', () => {
        const templatePath = path.join(__dirname, '..', 'views', 'partials', 'footer.ejs');
        const template = fs.readFileSync(templatePath, 'utf8');

        const html = ejs.render(
            template,
            {
                pageScripts: [],
                user: null
            },
            { filename: templatePath }
        );

        expect(html).toContain('/policy/shipping');
        expect(html).toContain('/policy/return');
        expect(html).toContain('/policy/payment');
        expect(html).toContain('/policy/privacy');
        expect(html).toContain('/css/chat-widget.css');
    });
});
