import React from 'react';
import { Snare } from './Snare';
import { Kick } from './Kick';
import { Hihat } from './Hihat';
import { HiTom } from './HiTom';
import { MidTom } from './MidTom';
import { FloorTom } from './FloorTom';
import { Crash } from './Crash';
import { Ride } from './Ride';
import { Overheads } from './drumkit/Overheads';

export function Drumkit(props) {
  // You can tweak each piece’s relative position/rotation here as needed.
  // If your individual components already position themselves correctly,
  // you can simply return them in one <group>.
  return (
    <group {...props} dispose={null}>
      <Kick />
      <Snare />
      <Hihat />
      <HiTom />
      <MidTom />
      <FloorTom />
      <Crash />
      <Ride />
      <Overheads />
    </group>
  );
}
