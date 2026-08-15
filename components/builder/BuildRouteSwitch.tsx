'use client';

import { useState } from 'react';
import BeltBuilder from './BeltBuilder';
import CustomOrderForm from './CustomOrderForm';

type Route = 'visual' | 'form';

/**
 * Two ways to reach the same place: a quote for a custom belt.
 *
 * The visual builder is first because seeing the belt change is what nobody
 * else offers. But a customer holding a reference photo of the belt they want
 * should not have to click through six steps to send it, so the form is one
 * tap away rather than buried.
 */
export default function BuildRouteSwitch() {
  const [route, setRoute] = useState<Route>('visual');

  const TABS: { id: Route; label: string; hint: string }[] = [
    { id: 'visual', label: 'Design it on screen', hint: 'See it change as you build' },
    { id: 'form', label: 'Send your design', hint: 'Upload a photo and specs' },
  ];

  return (
    <div>
      <div role="tablist" aria-label="How to start your custom belt" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = route === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setRoute(tab.id)}
              className={`flex-1 rounded-[--radius-plate] border px-5 py-4 text-left transition-colors ${
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-subtle/30 hover:border-subtle/60'
              }`}
            >
              <span
                className={`block font-display text-base uppercase tracking-wide ${
                  active ? 'text-link' : 'text-ink'
                }`}
              >
                {tab.label}
              </span>
              <span className="mt-0.5 block font-body text-2xs text-muted">{tab.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">{route === 'visual' ? <BeltBuilder /> : <CustomOrderForm />}</div>
    </div>
  );
}
