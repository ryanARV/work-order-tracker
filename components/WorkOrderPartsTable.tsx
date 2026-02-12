'use client';

import { useState } from 'react';
import IssuePartsModal from './IssuePartsModal';

interface Part {
  id: string;
  partNumber: string | null;
  description: string;
  quantityOnHand: number;
  quantityReserved: number;
}

interface IssuedBy {
  id: string;
  name: string;
}

interface WorkOrderPart {
  id: string;
  partId: string | null;
  description: string;
  quantity: number;
  quantityIssued: number;
  unitCost: number;
  unitPrice: number;
  billType: string;
  issuedAt: string | null;
  part: Part | null;
  issuedBy: IssuedBy | null;
}

interface WorkOrderPartsTableProps {
  parts: WorkOrderPart[];
  workOrderId: string;
  userRole: string;
  onUpdate: () => void;
}

export default function WorkOrderPartsTable({
  parts,
  workOrderId,
  userRole,
  onUpdate,
}: WorkOrderPartsTableProps) {
  const [selectedPart, setSelectedPart] = useState<WorkOrderPart | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const canIssueParts = ['PARTS', 'ADMIN', 'MANAGER'].includes(userRole);

  const getIssueStatus = (part: WorkOrderPart) => {
    if (part.quantityIssued === 0) {
      return { label: 'Not Issued', className: 'bg-gray-100 text-gray-800' };
    } else if (part.quantityIssued < part.quantity) {
      return { label: 'Partially Issued', className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Fully Issued', className: 'bg-green-100 text-green-800' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleIssue = (part: WorkOrderPart) => {
    setSelectedPart(part);
    setShowIssueModal(true);
  };

  const handleIssueComplete = () => {
    setShowIssueModal(false);
    setSelectedPart(null);
    onUpdate();
  };

  if (parts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No parts have been added to this work order yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Part #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {canIssueParts && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parts.map((part) => {
              const status = getIssueStatus(part);
              return (
                <tr key={part.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {part.part?.partNumber || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div>{part.description}</div>
                    {part.billType !== 'CUSTOMER' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Bill to: {part.billType}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {part.quantityIssued} / {part.quantity}
                    {part.part && (
                      <div className="text-xs text-gray-500 mt-1">
                        On hand: {part.part.quantityOnHand}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(part.unitPrice)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(part.quantity * part.unitPrice)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {part.issuedBy && (
                      <div className="text-xs text-gray-500 mt-1">
                        by {part.issuedBy.name}
                      </div>
                    )}
                  </td>
                  {canIssueParts && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {part.quantityIssued < part.quantity && (
                        <button
                          onClick={() => handleIssue(part)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Issue
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showIssueModal && selectedPart && (
        <IssuePartsModal
          part={selectedPart}
          workOrderId={workOrderId}
          onClose={() => setShowIssueModal(false)}
          onIssued={handleIssueComplete}
        />
      )}
    </>
  );
}
