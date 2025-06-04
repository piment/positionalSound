   
   <>
   {meshes.map((meshObj, idx) => {
                const { id, type, name } = meshObj;
                const Part = COMPONENTS[type];
                const angle = (idx / meshes.length) * Math.PI * 2;
                const dist = 10 + idx * 5;
                const subs = assignments[id] || [];
                const syncedSubs = subs.map((t) => ({
                  ...t,
                  volume: settings[t.id]?.volume ?? t.volume,
                  sendLevel: settings[t.id]?.sendLevel ?? t.sendLevel,
                }));
                return (
                  <ObjSound
                    key={id} // ✅ unique
                    name={name} // ✅ used in scene.getObjectByName
                    dist={dist}
                    subs={syncedSubs}
                    on={playing}
                    listener={listener}
                    convolver={convolver}
                    onAnalyserReady={handleAnalyserReady}
                    onVolumeChange={handleVolumeChange}
                    onSubsChange={(newSubs) =>
                      setAssignments((a) => ({ ...a, [id]: newSubs }))
                    }
                    playStartTime={playOffset}
                    pauseTime={pauseTime}
                    masterTapGain={masterTapGain}
                    visibleMap={settings}
                    onMainEnded={() => {
                      setPauseTime(0);
                      setPlayOffset(0);
                      setPlaying(false);
                    }}
                    mainTrackId={mainTrackId}
                    removeMesh={() => removeMesh(id)}
                    onNodeReady={(trackId, node) => {
                      activeNodesRef.current[trackId]?.stop?.();
                      activeNodesRef.current[trackId] = node;
                    }}
                  >
                    <Part />
                  </ObjSound>
                );
              })}
    
              {/* Play unassigned tracks as well (just at listener position) */}
              {(assignments.null || []).map((sub) => {
                const isMain = sub.id === mainTrackId;
                return (
                  <Sound
                    key={sub.id}
                    name={sub.name}
                    subs={[sub]}
                    on={playing}
                    trackId={sub.id}
                    url={sub.url}
                    paused={false}
                    listener={listener}
                    convolver={convolver}
                    analyser={sources[0]?.analyser}
                    onSubsChange={(newSubs) =>
                      setAssignments((a) => ({ ...a, null: newSubs }))
                    }
                    sendLevel={sub.sendLevel}
                    volume={sub.volume}
                    playStartTime={playOffset}
                    pauseTime={pauseTime}
                    // onAnalyserReady={(analyser) =>
                    //   handleAnalyserReady(sub.id, analyser, sub.volume)
                    // }
                    onAnalyserReady={handleAnalyserReady}
                    // onVolumeChange={(vol) => handleVolumeChange(sub.id, vol)}
                    onVolumeChange={handleVolumeChange}
                    masterTapGain={masterTapGain}
                    visible={settings[sub.id]?.visible}
                    buffer={sub.buffer}
                    isMain={isMain} // ✅ NEW
                    onMainEnded={() => {
                      // ✅ NEW
                      setPauseTime(0);
                      setPlayOffset(0);
                      setPlaying(false);
                    }}
                    // no meshRef or panner → dry playback
                    onNodeReady={(id, node) => {
                      activeNodesRef.current[id]?.stop?.(); // Stop any old one
                      activeNodesRef.current[id] = node;
                    }}
                  />
                );
              })}
    
              {mode === 'visualizerMode' && (
                <FrequencySpectrum
                  sources={sourcesForFloor} // your AudioAnalyser
                  playing={playing} // your play flag
                  // width={30}
                  // depth={10}               // spread across X
                  maxHeight={15} // Y scale
                  // pointSize={6}               // size of each dot
                />
              )}
              <EnvComp playing={playing} analyser={masterAnalyser} />
              <Controls /></>