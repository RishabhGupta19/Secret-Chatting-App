export default function Delete({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Confirm Disconnect</h3>
        <p>Are you sure you want to Disconnect?<br />This action cannot be undone.</p>
        <div className="modal-buttons">
          <button onClick={onCancel} style={{ background: '#64748b' }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="bg-red-600">
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}