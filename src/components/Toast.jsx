export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg text-sm text-center">
      {message}
    </div>
  );
}