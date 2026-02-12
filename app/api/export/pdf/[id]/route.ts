import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const billType = searchParams.get('billType'); // 'CUSTOMER_PAY', 'WARRANTY', or null for all

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            timeEntries: {
              where: {
                deletedAt: null,
                approvalState: {
                  in: ['APPROVED', 'LOCKED'],
                },
              },
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Filter line items by bill type if specified
    const filteredLineItems = billType
      ? workOrder.lineItems.filter((item) => item.billType === billType)
      : workOrder.lineItems;

    let yPosition = 750;

    const titleSuffix = billType === 'CUSTOMER_PAY'
      ? ' - CUSTOMER PAY'
      : billType === 'WARRANTY'
      ? ' - WARRANTY'
      : '';

    page.drawText(`WORK ORDER BILLING SUMMARY${titleSuffix}`, {
      x: 50,
      y: yPosition,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    page.drawText(`Work Order: ${workOrder.woNumber}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: fontBold,
    });

    yPosition -= 20;

    page.drawText(`Customer: ${workOrder.customer.name}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });

    yPosition -= 15;

    // Format billing address
    const addressParts = [
      workOrder.customer.billingStreet,
      workOrder.customer.billingCity,
      workOrder.customer.billingState,
      workOrder.customer.billingZip,
    ].filter(Boolean);

    if (addressParts.length > 0) {
      page.drawText(addressParts.join(', '), {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    if (workOrder.customer.contactEmail) {
      page.drawText(`Email: ${workOrder.customer.contactEmail}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    if (workOrder.customer.contactPhone) {
      page.drawText(`Phone: ${workOrder.customer.contactPhone}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });

    yPosition -= 30;

    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 562, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    page.drawText('LINE ITEMS', {
      x: 50,
      y: yPosition,
      size: 14,
      font: fontBold,
    });

    yPosition -= 25;

    for (const lineItem of filteredLineItems) {
      if (!lineItem.billable) continue;

      const totalSeconds = lineItem.timeEntries.reduce(
        (sum, entry) => sum + (entry.durationSeconds || 0),
        0
      );

      const hours = (totalSeconds / 3600).toFixed(2);

      const techNames = [
        ...new Set(lineItem.timeEntries.map((e) => e.user.name)),
      ].join(', ');

      const notes = lineItem.timeEntries
        .filter((e) => e.notes)
        .map((e) => e.notes)
        .join('; ');

      page.drawText(lineItem.description, {
        x: 50,
        y: yPosition,
        size: 10,
        font: fontBold,
        maxWidth: 300,
      });

      yPosition -= 15;

      page.drawText(`Labor Hours: ${hours}`, {
        x: 70,
        y: yPosition,
        size: 9,
        font: font,
      });

      yPosition -= 12;

      if (techNames) {
        const techText = `Technicians: ${techNames}`;
        page.drawText(
          techText.length > 60 ? techText.substring(0, 57) + '...' : techText,
          {
            x: 70,
            y: yPosition,
            size: 9,
            font: font,
          }
        );
        yPosition -= 12;
      }

      if (notes) {
        const notesText = `Notes: ${notes}`;
        const maxNotesLength = 70;
        page.drawText(
          notesText.length > maxNotesLength
            ? notesText.substring(0, maxNotesLength - 3) + '...'
            : notesText,
          {
            x: 70,
            y: yPosition,
            size: 8,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
            maxWidth: 450,
          }
        );
        yPosition -= 12;
      }

      yPosition -= 10;

      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }
    }

    yPosition -= 20;

    const totalSeconds = filteredLineItems.reduce(
      (sum, item) =>
        sum +
        (item.billable
          ? item.timeEntries.reduce(
              (entrySum, entry) => entrySum + (entry.durationSeconds || 0),
              0
            )
          : 0),
      0
    );

    const totalHours = (totalSeconds / 3600).toFixed(2);

    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 562, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    page.drawText(`TOTAL BILLABLE HOURS: ${totalHours}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: fontBold,
    });

    yPosition -= 60;

    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 300, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yPosition -= 15;

    page.drawText('Customer Signature', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });

    yPosition -= 40;

    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 300, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yPosition -= 15;

    page.drawText('Date', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });

    const pdfBytes = await pdfDoc.save();

    const filenameSuffix = billType === 'CUSTOMER_PAY'
      ? '-customer-pay'
      : billType === 'WARRANTY'
      ? '-warranty'
      : '';

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${workOrder.woNumber}${filenameSuffix}-billing.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
