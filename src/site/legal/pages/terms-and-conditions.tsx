import {createLegalPage} from '@/site/legal/legal-page';

const {LegalPage, generateMetadata} = createLegalPage('terms-and-conditions');

export default LegalPage;
export {generateMetadata};
