# McRelish

Website and ordering system for McRelish (Awka): menu, cart, Flutterwave checkout, tickets, customer accounts and a staff dashboard.

- **Website:** React + TanStack Start (this folder).
- **Backend:** plain PHP and MySQL in `backend/` (works on XAMPP). See `backend/README.md` for setup.

## Run it

1. Set up the backend first (`backend/README.md`), and start it.
2. `npm install`
3. `npm run dev`, then open the address it prints.

Useful commands: `npm run build`, `npm test`, `npm run lint`.

`.env` holds one setting, `VITE_API_URL`, the address of the PHP API. The first admin account is created with `php bin/create-admin.php` (see the backend README); after that, staff roles are managed in the dashboard.
