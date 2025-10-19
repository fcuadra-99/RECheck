import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
      <p className="mb-4">You don't have permission to view this page.</p>
      <Link to="/">Go to dashboard</Link>
    </div>
  );
}
