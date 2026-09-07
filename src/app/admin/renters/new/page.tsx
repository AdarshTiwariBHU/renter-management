import { redirect } from 'next/navigation';

export default function AdminNewRenterRedirect() {
  redirect('/renters/new');
}
