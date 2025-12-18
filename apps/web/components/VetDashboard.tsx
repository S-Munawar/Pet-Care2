'use client';

export default function VetDashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🩺 Veterinarian Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Today&apos;s Appointments</h3>
          <p className="text-sm opacity-70">View scheduled appointments</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Patients</h3>
          <p className="text-sm opacity-70">Manage patient records</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Prescriptions</h3>
          <p className="text-sm opacity-70">Write and manage prescriptions</p>
        </div>
      </div>
    </div>
  );
}
