export function ConfigScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="font-display text-lg font-semibold">DateOs</p>
      <p className="mt-3 max-w-sm text-sm text-muted">{message}</p>
      <ol className="mt-6 max-w-sm space-y-2 text-left text-sm text-fg">
        <li>1. Vercel → Project → Settings → Environment Variables</li>
        <li>
          2. <code className="text-primary">DATABASE_URL</code> de Neon (host con{" "}
          <code>-pooler</code>)
        </li>
        <li>
          3. <code className="text-primary">BETTER_AUTH_SECRET</code> (32+ caracteres)
        </li>
        <li>
          4. <code className="text-primary">BETTER_AUTH_URL</code> ={" "}
          <code>https://dateos-six.vercel.app</code>
        </li>
        <li>5. Redeploy</li>
      </ol>
    </div>
  );
}
