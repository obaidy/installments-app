export default function NotAuthorized() {
  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-xl font-semibold">Not authorized</h1>
      <p className="text-muted-foreground">Your account does not have access to the admin dashboard.</p>
    </div>
  );
}

