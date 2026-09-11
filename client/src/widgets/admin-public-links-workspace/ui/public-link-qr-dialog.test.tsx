import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkQrDialog } from './public-link-qr-dialog';

describe('PublicLinkQrDialog', () => {
  afterEach(cleanup);

  it('shows the code, the link and the actions without leaving the list', async () => {
    const user = userEvent.setup();
    const onCopyShortLink = vi.fn().mockResolvedValue(undefined);

    render(
      <PublicLinkQrDialog
        shortCode="DEMO2026"
        linkUrl="https://example.com/t/DEMO2026"
        qrUrl="https://qr.example/DEMO2026.png"
        onClose={vi.fn()}
        onCopyShortLink={onCopyShortLink}
      />,
    );

    expect(screen.getByRole('dialog', { name: /QR-код ссылки DEMO2026/ })).toBeInTheDocument();
    expect(screen.getByAltText('QR-код публичной ссылки DEMO2026')).toHaveAttribute(
      'src',
      'https://qr.example/DEMO2026.png',
    );
    expect(screen.getByText('https://example.com/t/DEMO2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Скопировать ссылку/ }));

    expect(onCopyShortLink).toHaveBeenCalledWith('DEMO2026');
  });

  it('stays closed until a short code is selected', () => {
    render(
      <PublicLinkQrDialog
        shortCode={null}
        linkUrl=""
        qrUrl=""
        onClose={vi.fn()}
        onCopyShortLink={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
