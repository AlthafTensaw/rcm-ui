import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgeCell, DateCell, MoneyCell, PercentCell } from './PrimitiveCells';
import { AssigneeCell, CodeCell, StatusCell } from './DomainCells';

describe('MoneyCell', () => {
  it('renders positive money', () => {
    render(<MoneyCell value={1234.56} />);
    expect(screen.getByText('$1,234.56')).toBeTruthy();
  });

  it('renders negative with leading minus', () => {
    render(<MoneyCell value={-164.86} />);
    expect(screen.getByText('-$164.86')).toBeTruthy();
  });

  it('renders em-dash for null', () => {
    render(<MoneyCell value={null} />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('colors negative red by default', () => {
    const { container } = render(<MoneyCell value={-100} />);
    const span = container.querySelector('span');
    expect(span?.style.color).toMatch(/money-negative|DC2626/);
  });

  it('respects highlightNegative=false', () => {
    const { container } = render(<MoneyCell value={-100} highlightNegative={false} />);
    const span = container.querySelector('span');
    expect(span?.style.color).toBe('inherit');
  });
});

describe('PercentCell', () => {
  it('formats percent with default decimals', () => {
    render(<PercentCell value={14.234} />);
    expect(screen.getByText('14.2%')).toBeTruthy();
  });

  it('respects custom decimals', () => {
    render(<PercentCell value={14.234} decimals={2} />);
    expect(screen.getByText('14.23%')).toBeTruthy();
  });
});

describe('DateCell', () => {
  it('formats short date', () => {
    render(<DateCell value="2025-06-23T00:00:00.000Z" format="short" />);
    // Allow for timezone variation: just check it produced numeric date format
    const text = screen.getByText(/\d{2}\/\d{2}\/\d{2}/);
    expect(text).toBeTruthy();
  });

  it('handles invalid date gracefully', () => {
    render(<DateCell value="not a date" />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('handles null', () => {
    render(<DateCell value={null} />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});

describe('AgeCell', () => {
  it('shows years for adults', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 47);
    render(<AgeCell dob={dob} />);
    expect(screen.getByText(/47 yrs/)).toBeTruthy();
  });

  it('shows months for infants', () => {
    const dob = new Date();
    dob.setMonth(dob.getMonth() - 6);
    render(<AgeCell dob={dob} />);
    expect(screen.getByText(/6 mo/)).toBeTruthy();
  });

  it('shows days for newborns', () => {
    const dob = new Date();
    dob.setDate(dob.getDate() - 3);
    render(<AgeCell dob={dob} />);
    expect(screen.getByText(/3 days/)).toBeTruthy();
  });
});

describe('CodeCell', () => {
  it('renders ICD code with description in title attribute', () => {
    render(<CodeCell code="I10" system="icd" />);
    const el = screen.getByText('I10');
    expect(el.getAttribute('title')).toContain('hypertension');
  });

  it('handles missing code', () => {
    render(<CodeCell code={null} system="icd" />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows description inline when requested', () => {
    render(<CodeCell code="I10" system="icd" showDescription />);
    expect(screen.getByText('I10')).toBeTruthy();
    // text node will include description
    expect(document.body.textContent).toMatch(/hypertension/i);
  });
});

describe('StatusCell', () => {
  it('renders status badge for known status', () => {
    render(<StatusCell taxonomy="claim" status="denied" />);
    expect(screen.getByText('Denied')).toBeTruthy();
  });

  it('renders em-dash for null', () => {
    render(<StatusCell taxonomy="claim" status={null} />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});

describe('AssigneeCell', () => {
  it('renders avatar with initials and full name', () => {
    render(<AssigneeCell name="Alex Smith" />);
    expect(screen.getByText('AS')).toBeTruthy();
    expect(screen.getByText('Alex Smith')).toBeTruthy();
  });

  it('handles single name', () => {
    render(<AssigneeCell name="Madonna" />);
    expect(screen.getByText('M')).toBeTruthy();
  });

  it('renders just avatar when showName is false', () => {
    render(<AssigneeCell name="Alex Smith" showName={false} />);
    expect(screen.getByText('AS')).toBeTruthy();
    expect(screen.queryByText('Alex Smith')).toBeNull();
  });

  it('renders em-dash for null', () => {
    render(<AssigneeCell name={null} />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});
