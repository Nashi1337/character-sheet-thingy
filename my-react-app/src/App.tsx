import React, { useState } from "react";

enum Attribute {
    Strength = "Strength",
    Dexterity = "Dexterity",
    Constitution = "Constitution",
    Intelligence = "Intelligence",
    Wisdom = "Wisdom",
    Charisma = "Charisma",
}

enum DiceType {
    d4 = "d4",
    d6 = "d6",
    d8 = "d8",
    d10 = "d10",
    d12 = "d12",
}

const diceProgression: DiceType[] = [
    DiceType.d4,
    DiceType.d6,
    DiceType.d8,
    DiceType.d10,
    DiceType.d12,
];

const maxAttributePoints = 5;
const maxSkillPoints = 15;

type Skill = {
    name: String;
    attribute: Attribute;
    base: boolean;
}

type CharacterData = {
    playerName: string;
    characterName: string;
    level: number;
    attributes: Record<Attribute, number>;
    skills: Record<string, number>;
};

const skillList: Skill[] = [
    { name: "Athletics", attribute: Attribute.Strength, base: true },
    { name: "Stealth", attribute: Attribute.Dexterity, base: true },
    { name: "Perception", attribute: Attribute.Wisdom, base: true },
    { name: "Survival", attribute: Attribute.Wisdom, base: true },
    { name: "Insight", attribute: Attribute.Wisdom, base: true },
    { name: "Intimidation", attribute: Attribute.Charisma, base: false },
    { name: "Persuasion", attribute: Attribute.Charisma, base: false },
    { name: "Crafting", attribute: Attribute.Wisdom, base: false },
    { name: "Nature", attribute: Attribute.Wisdom, base: false },
];

const buttonStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s ease-in-out",
};

const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: "#0056b3",
};

const getDiceStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "0.3rem 0.75rem",
    borderRadius: "999px",
    backgroundColor: isActive ? "#ffc107" : "#e0e0e0",
    color: isActive ? "#212529" : "#888",
    fontWeight: isActive ? "bold" : "normal",
    boxShadow: isActive ? "0 0 5px rgba(0,0,0,0.2)" : "none",
    transition: "all 0.2s ease-in-out",
    fontFamily: "monospace",
    transform: isActive ? "scale(1.15)" : "scale(1)",
    transition: "transform 0.3s ease, fill 0.3s ease",
});

function App() {
    const STORAGE_KEY = "savageWorldsCharacter";
    const [playerName, setPlayerName] = useState("");
    const [characterName, setCharacterName] = useState("");
    const [level, setLevel] = useState(1);

    const [attributes, setAttributes] = useState<Record<Attribute, number>>({
        [Attribute.Strength]: 0,
        [Attribute.Dexterity]: 0,
        [Attribute.Constitution]: 0,
        [Attribute.Intelligence]: 0,
        [Attribute.Wisdom]: 0,
        [Attribute.Charisma]: 0,
    });

    const saveCharacter = () => {
        const data: CharacterData = {
            playerName,
            characterName,
            level,
            attributes,
            skills,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        alert("Character saved!");
    };

    const loadCharacter = () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return alert("No saved character found.");

        const parsed: CharacterData = JSON.parse(data);
        setPlayerName(parsed.playerName);
        setCharacterName(parsed.characterName);
        setLevel(parsed.level);
        setAttributes(parsed.attributes);
        setSkills(parsed.skills);
    };


    const resetCharacter = () => {
        if (!confirm("Are you sure you want to reset everything?")) return;

        setPlayerName("");
        setCharacterName("");
        setLevel(1);
        setAttributes({
            [Attribute.Strength]: 0,
            [Attribute.Dexterity]: 0,
            [Attribute.Constitution]: 0,
            [Attribute.Intelligence]: 0,
            [Attribute.Wisdom]: 0,
            [Attribute.Charisma]: 0,
        });
        setSkills(() => {
            const resetSkills: Record<string, number> = {};
            skillList.forEach((skill) => {
                resetSkills[skill.name] = skill.base ? 0 : -1;
            });
            return resetSkills;
        });
    };

    const exportCharacter = () => {
        const data: CharacterData = {
            playerName,
            characterName,
            level,
            attributes,
            skills
        }
        const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${characterName || "character"}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const importCharacter = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try{
                const text = e.target?.result as string;
                const parsed: CharacterData = JSON.parse(text);
                setPlayerName(parsed.playerName);
                setCharacterName(parsed.playerName);
                setLevel(parsed.level);
                setAttributes(parsed.attributes);
                setSkills(parsed.skills);
                alert("Character loaded successfully.");
            }catch(err){
                alert("Failed to imprt character. Invalid file format.");
            }
        };
        reader.readAsText(file);
    }

    const [skills, setSkills] = useState<Record<string, number>>(
        () => {
            const initial: Record<string, number> = {};
            skillList.forEach(skill => {
                initial[skill.name] = skill.base ? 0 : -1;
            });
            return initial;
        }
    )

    const getSkillCost = (currentLevel: number, targetLevel: number, linkedAttr: number) => {
        let cost = 0;
        for (let i = currentLevel + 1; i <= targetLevel; i++) {
            cost += i <= linkedAttr ? 1 : 2;
        }
        return cost;
    };

    const increaseLevel = () => setLevel((prev) => prev + 1);
    const decreaseLevel = () => {
        if (level > 1) setLevel((prev) => prev - 1);
    };

    const usedAttributePoints = Object.values(attributes).reduce((sum, value) => sum + value, 0);
    const availableAttributePoints = maxAttributePoints - usedAttributePoints;

    const usedSkillPoints = skillList.reduce((sum, skill) => {
        const current = skills[skill.name];
        const linked = attributes[skill.attribute];
        if (current < 0) return sum;
        return sum + getSkillCost(-1, current, linked);
    }, 0);
    const availableSkillPoints = maxSkillPoints - usedSkillPoints;

    const increaseAttribute = (attr: Attribute) => {
        setAttributes((prev) => {
            const current = prev[attr];
            if(current < diceProgression.length-1 && availableAttributePoints > 0){
                return {...prev,[attr]:current+1};
            }
        });
    };

    const decreaseAttribute = (attr: Attribute) => {
        setAttributes((prev) => {
            const current = prev[attr];
            if(current > 0){
                return {...prev, [attr]:current-1};
            }
            return prev;
        })
    };

    const increaseSkill = (name: string) => {
        setSkills(prev => {
            const current = prev[name];
            const skillInfo = skillList.find(s => s.name === name)!;
            const linkedAttrLevel = attributes[skillInfo.attribute];
            const newLevel = current + 1;
            const cost = getSkillCost(current, newLevel, linkedAttrLevel);

            if (current < diceProgression.length - 1 && usedSkillPoints + cost <= maxSkillPoints) {
                return { ...prev, [name]: newLevel };
            }
            return prev;
        });
    };

    const decreaseSkill = (name:String) => {
        setSkills(prev => {
            const current = prev[name];
            const min = skillList.find(skill => skill.name === name)?.base ? 0 : -1;
            if(current > min){
                return {...prev, [name]:current-1};
            }
            return prev;
        })
    }

    const renderDiceShape = (die: DiceType, isActive: boolean) => {
        const size = 32;
        const color = isActive ? "#ffc107" : "#ccc";

        switch (die) {
            case DiceType.d4:
                return (
                    <div style={{transition: "transform 0.3s", cursor: "pointer"}}>
                        <svg width={size} height={size} viewBox="0 0 100 100">
                            <polygon points="50,10 90,90 10,90" fill={color}/>
                        </svg>
                    </div>
                        );
                        case DiceType.d6:
                        return (
                        <svg width={size} height={size} viewBox="0 0 100 100">
                            <rect x="20" y="20" width="60" height="60" fill={color}/>
                        </svg>
                        );
                        case DiceType.d8:
                        return (
                        <svg width={size} height={size} viewBox="0 0 100 100">
                            <polygon points="50,0 100,50 50,100 0,50" fill={color}/>
                        </svg>
                        );
                        case DiceType.d10:
                        return (
                        <svg width={size} height={size} viewBox="0 0 100 100">
                            <polygon points="50,0 90,30 75,90 25,90 10,30" fill={color}/>
                        </svg>
                        );
                        case DiceType.d12:
                        return (
                        <svg width={size} height={size} viewBox="0 0 100 100">
                            <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill={color}/>
                        </svg>
                        );
                        default:
                        return null;
                        }
                        };

                        const rollDie = (sides: number, explode = true): number => {
                        let total = 0;
                        let roll = 0;
                        do {
                        roll = Math.ceil(Math.random() * sides);
                        total += roll;
                    } while (explode && roll === sides); // exploding die logic
                        return total;
                    };

                        const diceValueFromType = {
                        d4: 4,
                        d6: 6,
                        d8: 8,
                        d10: 10,
                        d12: 12,
                    };

                        return (
                        <div style={{
                            padding: "2rem",
                            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                            maxWidth: "1000px",
                            margin: "0 auto",
                            borderRadius: "12px",
                            boxShadow: "0 0 10px rgba(0,0,0,0.1)"
                        }}>
                            <h1>Character Sheet</h1>

                            <label>
                                Player Name:
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    style={{display: "block", marginBottom: "1rem", width: "100%"}}
                                />
                            </label>

                            <label>
                                Character Name:
                                <input
                                    type="text"
                                    value={characterName}
                                    onChange={(e) => setCharacterName(e.target.value)}
                                    style={{display: "block", marginBottom: "1rem", width: "100%"}}
                                />
                            </label>

                            <div style={{display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem"}}>
                                <label>Level:</label>
                                <button onClick={decreaseLevel} disabled={level <= 1}>-</button>
                                <span>{level}</span>
                                <button onClick={increaseLevel}>+</button>
                            </div>

                            <div style={{display: "flex", gap: "2rem"}}>
                                <div style={{flex: 1}}>
                                    <h2>Attributes</h2>
                                    <div style={{marginBottom: "1rem", fontWeight: "bold"}}>
                                        Attribute Points Left: {availableAttributePoints}
                                    </div>
                                    {Object.values(Attribute).map((attr) => {
                                        const index = attributes[attr];
                                        return (
                                            <div key={attr} style={{marginBottom: "1rem"}}>
                                                <strong>{attr}</strong>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    marginTop: "0.25rem"
                                                }}>
                                                    <button onClick={() => decreaseAttribute(attr)}
                                                            disabled={index === 0}>-
                                                    </button>
                                                    {diceProgression.map((die, i) => (
                                                        <div key={die} style={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            opacity: i === index ? 1 : 0.4,
                                                            transform: i === index ? "scale(1.1)" : "scale(1)",
                                                            transition: "all 0.2s ease-in-out",
                                                        }}>
                                                            {renderDiceShape(die, i === index)}
                                                            <small style={{
                                                                fontSize: "0.75rem",
                                                                fontWeight: i === index ? "bold" : "normal"
                                                            }}>
                                                                {die}
                                                            </small>
                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={() => increaseAttribute(attr)}
                                                        disabled={index === diceProgression.length - 1 || availableAttributePoints === 0}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{flex: 1}}>
                                    <h2>Skills</h2>
                                    <div style={{marginBottom: "1rem", fontWeight: "bold"}}>
                                        Skill Points Left: {availableSkillPoints}
                                    </div>
                                    {skillList.map((skill) => {
                                        const index = skills[skill.name];
                                        const min = skill.base ? 0 : -1;
                                        return (
                                            <div key={skill.name} style={{marginBottom: "1rem"}}>
                                                <strong>{skill.name}</strong> <small>({skill.attribute})</small>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    marginTop: "0.25rem"
                                                }}>
                                                    <button onClick={() => decreaseSkill(skill.name)}
                                                            disabled={index === min}>-
                                                    </button>
                                                    {diceProgression.map((die, i) => (
                                                        <div key={die} style={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            opacity: i === index ? 1 : 0.4,
                                                            transform: i === index ? "scale(1.1)" : "scale(1)",
                                                            transition: "all 0.2s ease-in-out",
                                                        }}>
                                                            {renderDiceShape(die, i === index)}
                                                            <small style={{
                                                                fontSize: "0.75rem",
                                                                fontWeight: i === index ? "bold" : "normal"
                                                            }}>
                                                                {die}
                                                            </small>
                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={() => increaseSkill(skill.name)}
                                                        disabled={index === diceProgression.length - 1 || availableSkillPoints === 0}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div
                                style={{
                                    marginTop: "2rem",

                                    padding: "1.5rem",
                                    borderRadius: "12px",
                                    boxShadow: "0 0 12px rgba(0,0,0,0.1)",
                                    fontFamily: "'Merriweather', serif",
                                    lineHeight: 1.6,
                                    maxWidth: "600px",
                                }}
                            >
                                <hr style={{margin: "2rem 0"}}/>
                                <h2>Live Preview</h2>
                                <div style={{marginTop: "2rem", display: "flex", gap: "1rem"}}>
                                    <button style={buttonStyle} onClick={saveCharacter}>💾 Save (Local)</button>
                                    <button style={buttonStyle} onClick={loadCharacter}>📂 Load (Local)</button>
                                    <button style={buttonStyle} onClick={resetCharacter}>🗑 Reset</button>
                                    <button style={buttonStyle} onClick={exportCharacter}>⬇ Export (JSON)</button>

                                    <label style={{...buttonStyle, display: "inline-block"}}>
                                        ⬆ Import (JSON)
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={importCharacter}
                                            style={{display: "none"}}
                                        />
                                    </label>
                                </div>
                                <div style={{display: "flex", flexDirection: "column", gap: "0.5rem"}}>
                                    <div><strong>Player:</strong> {playerName || "N/A"}</div>
                                    <div><strong>Character:</strong> {characterName || "N/A"}</div>
                                    <div><strong>Level:</strong> {level}</div>

                                    <div>
                                        <strong>HP:</strong> {20 + Math.floor(level / 2) * (attributes[Attribute.Constitution] + 1)}
                                    </div>
                                    <div><strong>Physical Defense:</strong> {attributes[Attribute.Constitution] + 1 + 2}
                                    </div>
                                    <div><strong>Special Defense:</strong> {attributes[Attribute.Intelligence] + 1}
                                    </div>

                                    <h3>Attributes</h3>
                                    <ul>
                                        {Object.values(Attribute).map(attr => (
                                            <li key={attr}
                                                style={{display: "flex", alignItems: "center", gap: "0.5rem"}}>
                                                {attr}: {diceProgression[attributes[attr]]}
                                                <button
                                                    onClick={() =>
                                                        alert(`${attr} Roll: ${rollDie(diceValueFromType[diceProgression[attributes[attr]]])}`)
                                                    }
                                                    style={{fontSize: "0.75rem", padding: "0.2rem 0.5rem"}}
                                                >
                                                    🎲 Roll
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <h3>Skills</h3>
                                    <ul>
                                        {skillList.map(skill => {
                                            const skillLevel = skills[skill.name];
                                            return (
                                                <li key={skill.name}
                                                    style={{display: "flex", alignItems: "center", gap: "0.5rem"}}>
                                                    {skill.name}:
                                                    ({skill.attribute}) {skillLevel < 0 ? "untrained" : ""}

                                                    <button
                                                        onClick={() =>
                                                            alert(`${skill.name} Roll: ${rollDie(diceValueFromType[diceProgression[skillLevel]])}`)
                                                        }
                                                        style={{fontSize: "0.75rem", padding: "0.2rem 0.5rem"}}
                                                    >
                                                        🎲 Roll
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        );
                        }

                        export default App;
