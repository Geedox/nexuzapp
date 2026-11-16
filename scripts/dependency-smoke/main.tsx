import { useState } from 'react';
import { LiFiWidget } from '@lifi/widget';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, useLocation } from 'react-router-dom';
import { Calendar } from '../../src/components/ui/calendar';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../../src/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '../../src/components/ui/drawer';
import { LineChart, Line } from 'recharts';
import '../../src/index.css';

export function Fixture() {
  const [selected, setSelected] = useState<Date>();
  const location = useLocation();
  return <>
    <output id="lifi">{String(!!LiFiWidget)}</output>
    <Link to="?view=next">Navigate</Link><output id="route">{location.search}</output>
    <Calendar mode="single" defaultMonth={new Date(2026, 10, 1)} selected={selected} onSelect={setSelected} disabled={{ before: new Date(2026, 10, 10) }} />
    <output id="selection">{selected?.getDate()}</output>
    <Dialog><DialogTrigger>Open dialog</DialogTrigger><DialogContent aria-describedby={undefined}><DialogTitle>Dialog check</DialogTitle></DialogContent></Dialog>
    <Drawer><DrawerTrigger>Open drawer</DrawerTrigger><DrawerContent aria-describedby={undefined}><DrawerTitle>Drawer check</DrawerTitle></DrawerContent></Drawer>
    <LineChart width={300} height={100} data={[{ value: 1 }, { value: 2 }]}><Line dataKey="value" isAnimationActive={false} /></LineChart>
  </>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Fixture /></BrowserRouter>);
