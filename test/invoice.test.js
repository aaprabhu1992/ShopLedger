'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, sku, hsn, gstRate, price, qty) {
  return { name, sku, hsn, gstRate, price, qty };
}

function compare(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

function invoiceFigures(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(({ hsn, gstPercent, line: gross, lineTax }) => ({
      hsn,
      gstPercent,
      line: gross,
      lineTax
    }))
  };
}

test('CURRENT BEHAVIOUR: order #1001 invoices 5% and 12% lines without a coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      line('Toor Dal', 'GRN-002', '0713', 5, 165, 2),
      line('Cow Ghee', 'DRY-001', '0405', 12, 450, 1)
    ]
  };
  const { invoice: result, checkout } = compare(order);

  assert.deepEqual(invoiceFigures(result), {
    subtotal: 780,
    discount: 0,
    tax: 70.5,
    cgst: 35.25,
    sgst: 35.25,
    total: 850.5,
    rows: [
      { hsn: '0713', gstPercent: 5, line: 330, lineTax: 16.5 },
      { hsn: '0405', gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.equal(checkout.tax, 70.5);
  assert.equal(checkout.total, 850.5);
});

test('CURRENT BEHAVIOUR: order #1002 SAVE10 is applied before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line('Rice', 'GRN-001', '1006', 5, 600, 1),
      line('Coffee', 'BEV-001', '0901', 18, 400, 1)
    ]
  };
  const { invoice: result, checkout } = compare(order);

  assert.deepEqual(invoiceFigures(result), {
    subtotal: 1000,
    discount: 100,
    tax: 91.8,
    cgst: 45.9,
    sgst: 45.9,
    total: 991.8,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 600, lineTax: 27 },
      { hsn: '0901', gstPercent: 18, line: 400, lineTax: 64.8 }
    ]
  });
  assert.equal(checkout.discount, 100);
  assert.equal(checkout.tax, 91.8);
  assert.equal(checkout.total, 991.8);
});

test('CURRENT BEHAVIOUR: order #1004 SAVE10 honors its ₹150 cap before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [line('Coffee', 'BEV-001', '0901', 18, 2240, 1)]
  };
  const { invoice: result, checkout } = compare(order);

  assert.deepEqual(invoiceFigures(result), {
    subtotal: 2240,
    discount: 150,
    tax: 376.2,
    cgst: 188.1,
    sgst: 188.1,
    total: 2466.2,
    rows: [
      { hsn: '0901', gstPercent: 18, line: 2240, lineTax: 376.2 }
    ]
  });
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.2);
  assert.equal(checkout.total, 2466.2);
});

test('CURRENT BEHAVIOUR: order #1008 all-18% lines without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [line('Packaged Tea', 'BEV-002', '0902', 18, 140, 2)]
  };
  const { invoice: result, checkout } = compare(order);

  assert.deepEqual(invoiceFigures(result), {
    subtotal: 280,
    discount: 0,
    tax: 50.4,
    cgst: 25.2,
    sgst: 25.2,
    total: 330.4,
    rows: [
      { hsn: '0902', gstPercent: 18, line: 280, lineTax: 50.4 }
    ]
  });
  assert.equal(checkout.tax, 50.4);
  assert.equal(checkout.total, 330.4);
});

test('FIXED BEHAVIOUR: invoice matches checkout for mixed GST slabs and capped SAVE10', () => {
  const order = {
    id: 2004,
    coupon: 'SAVE10',
    items: [
      line('Rice', 'GRN-001', '1006', 5, 600, 1),
      line('Butter', 'DRY-002', '0405', 12, 440, 1),
      line('Coffee', 'BEV-001', '0901', 18, 1200, 1)
    ]
  };
  const { invoice: result, checkout } = compare(order);

  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 278.79);
  assert.equal(checkout.cgst, 139.4);
  assert.equal(checkout.sgst, 139.39);
  assert.equal(checkout.total, 2368.79);
  assert.deepEqual(invoiceFigures(result), {
    subtotal: 2240,
    discount: 150,
    tax: 278.79,
    cgst: 139.4,
    sgst: 139.39,
    total: 2368.79,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 600, lineTax: 27.99 },
      { hsn: '0405', gstPercent: 12, line: 440, lineTax: 49.26 },
      { hsn: '0901', gstPercent: 18, line: 1200, lineTax: 201.54 }
    ]
  });
});
