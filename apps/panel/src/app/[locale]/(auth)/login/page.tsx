import { type JSX } from 'react';
import { useTranslations } from 'next-intl';

import { LoginForm } from './login-form';

export default function LoginPage(): JSX.Element {
  const t = useTranslations('LoginPage');

  return (
    <LoginForm
      labels={{
        email: t('email'),
        login: t('login'),
        password: t('password'),
        withGoogle: t('withGoogle'),
      }}
    />
  );
}
