import {createLegalPage} from '@/site/legal/legal-page';

const {LegalPage, generateMetadata} = createLegalPage('about-us');

export default LegalPage;
export {generateMetadata};
