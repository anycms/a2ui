import { useState, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { ComponentViewProps } from '@anycms/a2ui-react';
import type { TabsProps } from '@anycms/a2ui-core';

export function TabsView({ props, buildChild }: ComponentViewProps<TabsProps>): ReactNode {
  // A2UI's Tabs is index-driven; we keep local state mirroring the vanilla renderer
  // (the data model can be bound later, but core's TabsProps currently has no value path).
  const [idx, setIdx] = useState(0);
  const value = String(idx);
  return (
    <div className="a2ui-leaf m-2">
      <Tabs value={value} onValueChange={(v) => setIdx(Number(v))}>
        <TabsList>
          {props.tabs.map((tab, i) => (
            <TabsTrigger key={i} value={String(i)}>{tab.title}</TabsTrigger>
          ))}
        </TabsList>
        {props.tabs.map((tab, i) => (
          <TabsContent key={i} value={String(i)}>{tab.child ? buildChild(tab.child) : null}</TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
