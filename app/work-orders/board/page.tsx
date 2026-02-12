'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkOrderCard {
  id: string;
  woNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  priority: string | null;
  kanbanPosition: number | null;
  progressDone: number;
  progressTotal: number;
  totalHours: number;
  assignedTechs: { id: string; name: string }[];
}

interface BoardData {
  columns: {
    OPEN: WorkOrderCard[];
    IN_PROGRESS: WorkOrderCard[];
    ON_HOLD_PARTS: WorkOrderCard[];
    ON_HOLD_DELAY: WorkOrderCard[];
    QC: WorkOrderCard[];
    READY_TO_BILL: WorkOrderCard[];
  };
}

const COLUMN_CONFIG = [
  { key: 'OPEN', title: 'Open', color: 'bg-gray-100', shortTitle: 'Open' },
  { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100', shortTitle: 'In Progress' },
  { key: 'ON_HOLD_PARTS', title: 'On Hold - Parts', color: 'bg-yellow-100', shortTitle: 'Parts' },
  { key: 'ON_HOLD_DELAY', title: 'On Hold - Delay', color: 'bg-orange-100', shortTitle: 'Delay' },
  { key: 'QC', title: 'QC', color: 'bg-purple-100', shortTitle: 'QC' },
  { key: 'READY_TO_BILL', title: 'Ready to Bill', color: 'bg-green-100', shortTitle: 'Ready' },
];

export default function KanbanBoardPage() {
  const router = useRouter();
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<{
    id: string;
    sourceColumn: string;
  } | null>(null);
  const [selectedCard, setSelectedCard] = useState<{
    id: string;
    sourceColumn: string;
  } | null>(null);

  useEffect(() => {
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    try {
      const res = await fetch('/api/work-orders/board');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch board');
      }
      const data = await res.json();
      setBoardData(data);
    } catch (error) {
      console.error('Error fetching board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    cardId: string,
    sourceColumn: string
  ) => {
    setDraggedCard({ id: cardId, sourceColumn });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();

    if (!draggedCard || !boardData) return;

    const { id, sourceColumn } = draggedCard;

    // If dropped in same column, do nothing
    if (sourceColumn === targetColumn) {
      setDraggedCard(null);
      return;
    }

    await moveCard(id, sourceColumn, targetColumn);
    setDraggedCard(null);
  };

  const moveCard = async (cardId: string, sourceColumn: string, targetColumn: string) => {
    if (!boardData) return;

    // Optimistic update
    const newBoardData = { ...boardData };
    const sourceCards = newBoardData.columns[sourceColumn as keyof typeof newBoardData.columns];
    const targetCards = newBoardData.columns[targetColumn as keyof typeof newBoardData.columns];

    const cardIndex = sourceCards.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) {
      const [card] = sourceCards.splice(cardIndex, 1);
      targetCards.push(card);
      setBoardData(newBoardData);
    }

    // Update server
    try {
      const res = await fetch(`/api/work-orders/${cardId}/board-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanbanColumn: targetColumn,
          kanbanPosition: targetCards.length,
        }),
      });

      if (!res.ok) {
        // Revert on error
        fetchBoard();
      }
    } catch (error) {
      console.error('Error updating board:', error);
      // Revert on error
      fetchBoard();
    }
  };

  const handleCardClick = (cardId: string, columnKey: string) => {
    if (selectedCard && selectedCard.id === cardId) {
      // Deselect if clicking the same card
      setSelectedCard(null);
    } else {
      // Select card
      setSelectedCard({ id: cardId, sourceColumn: columnKey });
    }
  };

  const handleColumnClick = async (targetColumn: string) => {
    if (!selectedCard) return;

    const { id, sourceColumn } = selectedCard;

    // If same column, just deselect
    if (sourceColumn === targetColumn) {
      setSelectedCard(null);
      return;
    }

    await moveCard(id, sourceColumn, targetColumn);
    setSelectedCard(null);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Work Order Board</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            <span className="hidden md:inline">Drag cards to update status</span>
            <span className="md:hidden">Tap card, then tap column to move</span>
          </p>
        </div>
        <Link
          href="/work-orders"
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm md:text-base whitespace-nowrap"
        >
          List View
        </Link>
      </div>

      {selectedCard && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm md:text-base">
          <p className="text-blue-800 font-medium">
            Card selected. Tap a column header to move it there.
            <button
              onClick={() => setSelectedCard(null)}
              className="ml-3 text-blue-600 hover:text-blue-800 underline"
            >
              Cancel
            </button>
          </p>
        </div>
      )}

      <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 -mx-2 px-2 md:mx-0 md:px-0">
        {COLUMN_CONFIG.map((column) => {
          const cards = boardData?.columns[column.key as keyof typeof boardData.columns] || [];

          return (
            <div
              key={column.key}
              className="flex-shrink-0 w-64 md:w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <div
                className={`${column.color} rounded-lg p-2 md:p-3 mb-3 cursor-pointer transition-all ${
                  selectedCard ? 'hover:ring-2 hover:ring-blue-400' : ''
                }`}
                onClick={() => selectedCard && handleColumnClick(column.key)}
              >
                <h2 className="font-semibold text-gray-800 flex justify-between items-center text-sm md:text-base">
                  <span className="md:hidden">{column.shortTitle}</span>
                  <span className="hidden md:inline">{column.title}</span>
                  <span className="bg-white px-2 py-1 rounded text-xs md:text-sm font-bold">
                    {cards.length}
                  </span>
                </h2>
              </div>

              <div className="space-y-2 md:space-y-3 min-h-[200px]">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id, column.key)}
                    onClick={() => handleCardClick(card.id, column.key)}
                    className={`bg-white rounded-lg shadow-md p-3 md:p-4 cursor-pointer hover:shadow-lg transition-all border-l-4 ${
                      selectedCard?.id === card.id
                        ? 'border-green-500 ring-2 ring-green-400'
                        : 'border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/work-orders/${card.id}`}
                        className="font-semibold text-blue-600 hover:text-blue-800 text-sm md:text-base"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {card.woNumber}
                      </Link>
                      {card.priority && (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(
                            card.priority
                          )} bg-opacity-10`}
                        >
                          {card.priority}
                        </span>
                      )}
                    </div>

                    <p className="text-xs md:text-sm text-gray-700 mb-2 md:mb-3 truncate" title={card.customerName}>
                      {card.customerName}
                    </p>

                    <div className="flex justify-between items-center text-xs md:text-sm text-gray-600">
                      <span>
                        {card.progressDone}/{card.progressTotal} Done
                      </span>
                      <span>{card.totalHours.toFixed(1)}h</span>
                    </div>

                    {card.assignedTechs.length > 0 && (
                      <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
                        {card.assignedTechs.map((tech) => (
                          <span
                            key={tech.id}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            title={tech.name}
                          >
                            {tech.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
