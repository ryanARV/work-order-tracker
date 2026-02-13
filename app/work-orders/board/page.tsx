'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH' | 'SERVICE_WRITER' | 'PARTS' | 'MANAGER';
}

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
  partsStatus: 'NO_PARTS' | 'ALL_ISSUED' | 'PARTIALLY_ISSUED' | 'NOT_ISSUED';
  isOutOfService: boolean;
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
  const [user, setUser] = useState<User | null>(null);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, boardRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/work-orders/board'),
      ]);

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      if (!boardRes.ok) {
        throw new Error('Failed to fetch board');
      }

      const userData = await userRes.json();
      const boardData = await boardRes.json();

      setUser(userData.user);
      setBoardData(boardData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoard = async () => {
    try {
      const res = await fetch('/api/work-orders/board');
      if (!res.ok) {
        throw new Error('Failed to fetch board');
      }
      const data = await res.json();
      setBoardData(data);
    } catch (error) {
      console.error('Error fetching board:', error);
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

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;

    switch (priority.toUpperCase()) {
      case 'HIGH':
        return 'badge-red';
      case 'MEDIUM':
        return 'badge-yellow';
      case 'LOW':
        return 'badge-green';
      default:
        return 'badge-gray';
    }
  };

  const getPartsStatusBadge = (status: WorkOrderCard['partsStatus']) => {
    switch (status) {
      case 'ALL_ISSUED':
        return (
          <span className="badge badge-green">
            ✓ Parts Ready
          </span>
        );
      case 'PARTIALLY_ISSUED':
        return (
          <span className="badge badge-yellow">
            ⚠ Parts Partial
          </span>
        );
      case 'NOT_ISSUED':
        return (
          <span className="badge badge-red">
            ✗ Waiting Parts
          </span>
        );
      case 'NO_PARTS':
        return null; // Don't show badge if no parts needed
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-header">Work Order Board</h1>
          <p className="section-subheader">
            <span className="hidden md:inline">Drag and drop cards to update status</span>
            <span className="md:hidden">Tap card, then tap column to move</span>
          </p>
        </div>
        <Link
          href="/work-orders"
          className="btn-secondary whitespace-nowrap"
        >
          ← List View
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
                className={`${column.color} rounded-lg p-3 mb-3 cursor-pointer transition-all shadow-sm ${
                  selectedCard ? 'hover:ring-2 hover:ring-blue-500 hover:shadow-md' : ''
                }`}
                onClick={() => selectedCard && handleColumnClick(column.key)}
              >
                <h2 className="font-bold text-gray-900 flex justify-between items-center text-sm md:text-base">
                  <span className="md:hidden">{column.shortTitle}</span>
                  <span className="hidden md:inline">{column.title}</span>
                  <span className="bg-white px-2.5 py-1 rounded-full text-xs md:text-sm font-bold shadow-sm">
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
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md p-3 md:p-4 cursor-move transition-all border-l-4 ${
                      selectedCard?.id === card.id
                        ? 'border-green-500 ring-2 ring-green-400 shadow-md'
                        : card.isOutOfService
                        ? 'border-red-600 ring-2 ring-red-400'
                        : 'border-blue-500'
                    }`}
                  >
                    {card.isOutOfService && (
                      <div className="mb-2 -mx-3 md:-mx-4 -mt-3 md:-mt-4 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-t-lg flex items-center gap-1">
                        <span>🚨</span>
                        <span className="hidden md:inline">OUT OF SERVICE</span>
                        <span className="md:hidden">OoS</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/work-orders/${card.id}`}
                        className="font-bold text-blue-600 hover:text-blue-700 text-sm md:text-base"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {card.woNumber}
                      </Link>
                      {card.priority && (
                        <span className={`badge ${getPriorityBadge(card.priority)}`}>
                          {card.priority}
                        </span>
                      )}
                    </div>

                    <p className="text-xs md:text-sm text-gray-700 mb-2 truncate" title={card.customerName}>
                      {card.customerName}
                    </p>

                    {getPartsStatusBadge(card.partsStatus) && (
                      <div className="mb-2">
                        {getPartsStatusBadge(card.partsStatus)}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs md:text-sm text-gray-600">
                      <span>
                        {card.progressDone}/{card.progressTotal} Done
                      </span>
                      <span>{card.totalHours.toFixed(1)}h</span>
                    </div>

                    {card.assignedTechs.length > 0 && (
                      <div className="mt-2 md:mt-3 flex flex-wrap gap-1.5">
                        {card.assignedTechs.map((tech) => (
                          <span
                            key={tech.id}
                            className="badge badge-gray text-xs"
                            title={tech.name}
                          >
                            👤 {tech.name.split(' ')[0]}
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
    </div>
  );
}
