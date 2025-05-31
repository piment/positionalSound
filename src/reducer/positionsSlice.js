// positionsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Each key is the “role” string that matches what you’ll call “type” or “role”
  // when spawning meshes. The array is [x, y, z] in world–space.
  drumkit : [  0, 0,  0 ],
  bass     : [  5, 0,  0 ],
  guitar1  : [ -5, 0,  0 ],
  guitar2  : [ -5, 0,  2 ],
  singer   : [  0, 0,  5 ],
  keyboard : [  5, 0,  5 ],
  // If the bass player is also the singer: just alias them to the same coords.
  // e.g. both keys “bass” and “singer” could point at the same array.
  // In this example, we already set them separately, but you could also do:
  // bass: [0,0,5], singer: [0,0,5]
};

const positionsSlice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    // If you want to allow updating a position at runtime:
    setPosition(state, action) {
      // payload = { role: 'bass', position: [x,y,z] }
      const { role, position } = action.payload;
      state[role] = position;
    },
  },
});

export const { setPosition } = positionsSlice.actions;
export default positionsSlice.reducer;
