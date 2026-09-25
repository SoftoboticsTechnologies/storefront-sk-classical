import type {Metadata} from 'next';
import {noIndexRobots} from '@/config/metadata';
import {AccountLayoutClient} from './account-layout-client';

export const metadata: Metadata = {
    robots: noIndexRobots(),
};

export default function AccountLayout({children}: LayoutProps<'/[locale]/account'>) {
    return (
        <AccountLayoutClient>{children}</AccountLayoutClient>
    );
}
