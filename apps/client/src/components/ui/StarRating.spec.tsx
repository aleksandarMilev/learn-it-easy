import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('renders 5 stars in read-only mode', () => {
    const { container } = render(<StarRating value={3} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children).toHaveLength(5);
  });

  it('renders in read-only mode when onChange is not provided', () => {
    render(<StarRating value={3} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders interactive buttons when onChange is provided', () => {
    const handleChange = vi.fn();
    render(<StarRating value={3} onChange={handleChange} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('calls onChange with the correct star value when clicked', () => {
    const handleChange = vi.fn();
    render(<StarRating value={0} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('4 stars'));
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange with 1 when the first star is clicked', () => {
    const handleChange = vi.fn();
    render(<StarRating value={0} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('1 star'));
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('does not render buttons in read-only mode', () => {
    render(<StarRating value={3} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('updates hover preview when mouse enters a star button', () => {
    const handleChange = vi.fn();
    render(<StarRating value={2} onChange={handleChange} />);

    const fourthStarButton = screen.getByLabelText('4 stars');
    fireEvent.mouseEnter(fourthStarButton);

    expect(fourthStarButton).toBeInTheDocument();
  });

  it('resets hover preview when mouse leaves', () => {
    const handleChange = vi.fn();
    render(<StarRating value={2} onChange={handleChange} />);

    const thirdStarButton = screen.getByLabelText('3 stars');
    fireEvent.mouseEnter(thirdStarButton);
    fireEvent.mouseLeave(thirdStarButton);

    expect(thirdStarButton).toBeInTheDocument();
  });
});
