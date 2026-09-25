import {createLegalPage} from '@/site/legal/legal-page';

const {LegalPage, generateMetadata} = createLegalPage('privacy-policy');

export default LegalPage;
export {generateMetadata};
