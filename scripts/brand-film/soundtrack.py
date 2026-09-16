import numpy as np, wave
from pathlib import Path
sr=44100; duration=26; t=np.arange(sr*duration)/sr
out=np.zeros((len(t),2)); rng=np.random.default_rng(24)
# Original restrained ambient score: warm sustained chords and soft glass notes.
for start,notes in [(0,[146.83,220,277.18,329.63]),(6,[130.81,196,246.94,329.63]),(12,[110,164.81,220,277.18]),(18,[146.83,220,293.66,369.99])]:
    local=t-start; env=np.clip(local/2,0,1)*np.clip((8-local)/2,0,1)
    for i,f in enumerate(notes):
        sig=(np.sin(2*np.pi*f*t+.12*np.sin(2*np.pi*.13*t))+.22*np.sin(2*np.pi*f*2*t))/len(notes)
        out[:,0]+=sig*env*.13;out[:,1]+=np.sin(2*np.pi*f*t+.15)*env*.12
for i,(start,f) in enumerate([(1,587.33),(3.3,440),(5.5,659.25),(7.8,554.37),(10,493.88),(12.9,659.25),(15,554.37),(17,440),(19.5,587.33),(21,739.99)]):
    q=t-start;env=np.where(q>=0,(1-np.exp(-np.maximum(q,0)*28))*np.exp(-np.maximum(q,0)*1.8),0)
    note=(np.sin(2*np.pi*f*q)+.15*np.sin(2*np.pi*f*3*q))*env*.048
    out[:,i%2]+=note;out[:,1-i%2]+=note*.65
out*= (np.clip(t/1.4,0,1)*np.clip((26-t)/2,0,1))[:,None]
with wave.open(str(Path(__file__).parent/'soundtrack.wav'),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype('<i2').tobytes())
