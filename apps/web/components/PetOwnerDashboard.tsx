'use client';

export default function PetOwnerDashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🐕 Pet Owner Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">My Pets</h3>
          <p className="text-sm opacity-70">Manage your pets</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Appointments</h3>
          <p className="text-sm opacity-70">View upcoming appointments</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Health Records</h3>
          <p className="text-sm opacity-70">Access pet health records</p>
        </div>
      </div>
    </div>
  );
}
