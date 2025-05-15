import { useState } from 'react';

export default function EnvVarsForm({ onChange }) {
  const [vars, setVars] = useState([{ key: '', value: '' }]);
  
  const updateVars = (newVars) => {
    setVars(newVars);
    onChange(Object.fromEntries(
      newVars.filter(v => v.key).map(v => [v.key, v.value])
    ));
  };
  
  return (
    <div className="env-vars-form">
      <h3>Environment Variables</h3>
      {vars.map((v, i) => (
        <div key={i} className="env-var-row">
          <input
            placeholder="KEY"
            value={v.key}
            onChange={e => updateVars(vars.map((item, idx) => 
              idx === i ? { ...item, key: e.target.value } : item
            ))}
          />
          <input
            placeholder="VALUE"
            value={v.value}
            onChange={e => updateVars(vars.map((item, idx) => 
              idx === i ? { ...item, value: e.target.value } : item
            ))}
          />
          <button onClick={() => updateVars(vars.filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={() => updateVars([...vars, { key: '', value: '' }])}>
        Add Variable
      </button>
    </div>
  );
}
