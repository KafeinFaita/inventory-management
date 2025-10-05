export default function SalesTable({ sales = [] }) {
  return (
    <div className="overflow-x-auto bg-base-200 p-4 rounded-lg shadow">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Items</th>
            <th>Total Quantity</th>
            <th>Total Amount (₱)</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            const totalQuantity = sale.items.reduce(
              (sum, i) => sum + i.quantity,
              0
            );

            const totalAmount = sale.items.reduce(
              (sum, i) => sum + i.priceAtSale * i.quantity,
              0
            );

            return (
              <tr key={sale._id}>
                <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                <td>
                  <ul>
                    {sale.items.map((item) => (
                      <li key={item.product?._id || item._id}>
                        {item.product?.name || "Unknown"} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{totalQuantity}</td>
                <td className="font-bold">₱{totalAmount.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
