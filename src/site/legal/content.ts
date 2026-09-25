/**
 * Static store pages (about + policies), copied from the brand's existing site
 * (skclassical.com). English only — the source has no translations. Inline
 * `**text**` renders bold.
 */
export type LegalBlock =
    | {type: 'heading'; text: string}
    | {type: 'paragraph'; text: string}
    | {type: 'list'; ordered?: boolean; items: string[]};

export interface LegalPageContent {
    title: string;
    description: string;
    blocks: LegalBlock[];
}

export const LEGAL_SLUGS = [
    'about-us',
    'privacy-policy',
    'return-policy',
    'shipping-policy',
    'terms-and-conditions',
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

const p = (text: string): LegalBlock => ({type: 'paragraph', text});
const h = (text: string): LegalBlock => ({type: 'heading', text});

export const LEGAL_PAGES: Record<LegalSlug, LegalPageContent> = {
    'about-us': {
        title: 'About Shri Kalaivani Costumes',
        description: 'Shri Kalaivani Costumes is your trusted destination for exquisite Indian ethnic wear, devotional essentials, and timeless accessories.',
        blocks: [
            p("Shri Kalaivani Costumes is your trusted destination for exquisite Indian ethnic wear, devotional essentials, and timeless accessories. From elegant sarees, lehenga cholis, and salwar suits to sacred pooja garlands, deity frames, and traditional jewelry, we bring together the finest collection that celebrates India's rich cultural heritage. Every piece in our store is thoughtfully curated to add grace, beauty, and spiritual significance to your life."),
            p("We cater to women, families, and devotees who cherish tradition and seek authentic, high-quality products for everyday wear, festive celebrations, and sacred rituals. Whether you're dressing up for a wedding, adorning your home temple, or simply expressing your personal style, our diverse range has something special for every occasion. Our customers are individuals who value craftsmanship, cultural roots, and meaningful adornment."),
            p("At Shri Kalaivani Costumes, we believe that clothing and accessories are more than just products—they are expressions of identity, devotion, and joy. We are committed to offering authentic designs, superior quality, and exceptional service that honors the traditions we hold dear. With every purchase, we aim to bring you closer to the beauty and sanctity of Indian culture."),
            p("**Shri Kalaivani Costumes — Where Tradition Meets Timeless Elegance.**"),
        ],
    },
    'terms-and-conditions': {
        title: 'Terms of Service',
        description: 'The terms and conditions that apply when you browse or purchase from Shri Kalaivani Costumes.',
        blocks: [
            p("**SHRI KALAIVANI COSTUMES** operates this website. The terms **we**, **us** and **our**, refers to SHRI KALAIVANI COSTUMES. The information on the website, tools and services is for the users. Browsing through the website means the user has accepted the terms, conditions, notices and policies of the website. Visiting or purchasing from the website means you are bound to the terms and conditions. The terms apply to all the vendors, browsers, merchants, content contributors and customers."),
            p("Please go through the terms and conditions mentioned on the website. If you do not agree to the conditions then do not access the website or use the services. The tools or features added to the website are also subject to terms and conditions. We reserve the right to replace or change the terms of service by posting updates on the website. You have to check such updates periodically to know the changes and decide to accept it or not. We have hosted our store on Nushop.store."),
            h('Section 1 – Online Store Terms'),
            p("You have to be a major to agree to the terms and conditions. With your consent, dependents can also use the website. Our products cannot be used illegally or for unauthorized purposes. Our services cannot be used to violate the laws in your jurisdiction. Any type of destructive virus, worm or code cannot be transmitted by you."),
            p("Violation or breach of any of the terms and conditions may lead to termination of your services."),
            h('Section 2 – General Conditions'),
            p("Without prior permission, you cannot duplicate, sell, copy or resell any information on the website."),
            p("We reserve the rules to deny service to anyone at any time for any reason."),
            h('Section 3 – Accuracy, Completeness and Timeliness Of Information'),
            p("If the information provided on the website is not accurate we are not responsible. It is always better to re-confirm the information and then take decisions to avoid risks."),
            h('Section 4 – Modifications To The Service And Prices'),
            p("The price of the products or services can change without any prior notice."),
            p("We are not liable to you or any other third party for a change in price or suspension of services."),
            h('Section 5 – Products Or Services'),
            p("The products and services may have limited quantities subject to the stock available. The display on the website may not accurately display the product colour. Return or exchange is subjected to our return or exchange policy. We do not give a warranty that our products, services and information can meet your expectations."),
        ],
    },
    'shipping-policy': {
        title: 'Shipping Policy',
        description: 'How and when Shri Kalaivani Costumes ships orders across India.',
        blocks: [
            p("We ship all over India and try to get the best rates for our customers. Orders placed Monday through Saturday IST will be processed on the same or following business day and will be shipped within two business days of order placement if the product(s) is(are) in inventory in our warehouse. If you want to inquire about the delivery time of a product, do not hesitate to contact us prior to placing your order. Our shipping charges varies as per the order value and delivery location. Shipping charges for your order will be calculated and displayed at checkout."),
            p("If you have any further questions, please don't hesitate to contact us at sagar.annadate@gmail.com"),
        ],
    },
    'return-policy': {
        title: 'Return Policy',
        description: 'Cancellation, return and exchange terms for Shri Kalaivani Costumes orders.',
        blocks: [
            p("**Return and Refund Policy**"),
            h('Cancellation Policy'),
            {type: 'list', ordered: true, items: [
                "In case there is an order cancellation, please do so before it is shipped. Once the product is shipped it can not be cancelled using our website",
            ]},
            h('Return Policy'),
            {type: 'list', ordered: true, items: [
                "Returns and exchanges are applicable only to select products. Detailed return eligibility and conditions are provided on the respective product pages. For most products, the standard return window is 3 days.",
                "The return policy for any product is subject to change without prior notice.",
                "In case we do not have pick up service available at your location, you would have to self-ship the product to our office Address.",
                "Return/Exchange charges may apply on case to case basis.",
            ]},
            h('Note for Return'),
            {type: 'list', items: [
                "The items should be unused and unwashed for hygiene reasons.",
                "The product should have the original packaging and tags in place. Items without the original tags will not be accepted.",
                "Customized products cannot be returned or exchanged",
                "Return/Exchange requests that are not raised within the return period (Refer product page) the product would not be accepted.",
            ]},
        ],
    },
    'privacy-policy': {
        title: 'Privacy Policy',
        description: 'How Shri Kalaivani Costumes collects, uses and protects your personal information.',
        blocks: [
            p("Your personal information is always kept confidential. The privacy policy is displayed on the website. The type of info collected from the customers and usage of this information is published here. We have a policy of not disclosing any information to third parties."),
            p("Using our website means you have agreed to the terms and conditions of the website. It applies to the people who have not got any transactions or who have got registered to the site and had business."),
            p("Personal information is mainly used to locate or contact a person. Other information like name address, phone number, fax, credit card information, financial profiles, identification number and e-mail address are also available with us and are always confidential."),
            h('Terms Of Our Privacy Policy'),
            h('Personal Information That We Collect'),
            p("Necessary information is collected for becoming a subscriber or member of our website. Our system collects the IP address of your computer automatically. But this detail does not give information about any particular person."),
            p("But **SHRI KALAIVANI COSTUMES** website doesn’t collect information about children."),
            h('Uses Of The Information Collected'),
            p("All the personal information collected is kept confidential. The information may be used for:"),
            {type: 'list', items: [
                "Send news about the website.",
                "Calculate the number of visitors",
                "Monitor the website",
                "Know the geographical location of the users",
                "Contact to give information about the website.",
                "Give a better shopping experience online.",
                "Update about the recent offers on the website.",
            ]},
            p("Some of the personal information is shared with the courier companies like addresses/contact details. We have to give some information to vendors. This personal information helps SHRI KALAIVANI COSTUMES to perform their duties and fulfil the order requirements. But private information cannot be accessed by unauthorised persons or organisations."),
            p("The Company will disclose your information, including, without limitation, your name, city, state, telephone number, email address, user ID history, quoting and listing history, and complaints, to law enforcement or other government officials if it is required to do so by law, regulation or other government authority or otherwise in cooperation with an investigation of governmental authority."),
            p("Cookies are used to save your personal information on your computer. It helps to calculate the number of times you use our website. Cookies do not keep any personal data of the visitors."),
            p("When the user browses **SHRI KALAIVANI COSTUMES**, cookies are replaced according to the interests of the users. Here none of your particulars like e-mail address, telephone, name or postal address is collected. We give you a safe shopping experience."),
            p("SHRI KALAIVANI COSTUMES gives some aggregate particulars like website statistics or demographics to sponsors, advertisers and other third parties. Third parties are not authorised to get any of your personal information."),
            p("SHRI KALAIVANI COSTUMES has many links to other websites. But once you leave **SHRI KALAIVANI COSTUMES** website, our privacy policy ends."),
        ],
    },
};
