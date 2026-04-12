# AG3NT Skills Framework

This guide explains the skill system, bundled skills, and how to create custom skills.

---

## What Are Skills?

**Skills** are reusable AI capabilities that can be enabled or disabled per agent session. They allow your agent to perform domain-specific tasks without modifying core code.

### Key Characteristics

- **Modular**: Each skill is self-contained in a folder (`skills/<skill-name>/`)
- **Declarative**: Skills are defined using `SKILL.md` format (machine-readable)
- **Composable**: Multiple skills can be combined in a single agent session
- **Type-Safe**: Tool definitions include TypeScript types and validation schemas
- **Discoverable**: Skills are discoverable by the agent and UI

### SKILL.md Format

The `SKILL.md` file is a standardized format for declaring skills:

```markdown
# Skill: Web Research

A skill for searching the web and extracting information.

## Features

- Google search integration
- Web scraping and content extraction
- Result ranking and filtering

## Tools

- `web_search(query: string, max_results: number = 5)`
- `web_scrape(url: string)`
- `extract_article(url: string) -> ArticleData`

## Parameters

### web_search

```json
{
  "query": {
    "type": "string",
    "description": "Search query"
  },
  "max_results": {
    "type": "number",
    "default": 5,
    "description": "Maximum results to return"
  }
}
```

## Examples

### Basic Web Search
```
Agent: Search for AI trends in 2024
Output: [list of search results]
```

### Article Extraction
```
Agent: Extract the main content from [URL]
Output: Article title, body, metadata
```

## Dependencies

- google-search-results (or similar service)
- Beautiful Soup 4 (for web scraping)
- requests

## Limitations

- Rate-limited by Google
- No authentication required
- Results may be region-dependent
```

---

## Bundled Skills (10)

AG3NT comes with 10 pre-built skills:

| Skill | Location | Purpose | Tools |
|-------|----------|---------|-------|
| **App Launcher** | `skills/app-launcher/` | Launch and control desktop applications | `launch_app()`, `kill_app()`, `list_apps()` |
| **Camera Capture** | `skills/camera-capture/` | Capture images from camera/webcam | `capture_image()`, `list_cameras()` |
| **Daily Briefing** | `skills/daily-briefing/` | Generate daily summaries from calendar/news | `generate_briefing()`, `schedule_briefing()` |
| **Deep Reasoning** | `skills/deep-reasoning/` | Extended thinking for complex problems | `think_deeply()`, `solve_step_by_step()` |
| **Example Skill** | `skills/example-skill/` | Template for creating custom skills | (none - reference only) |
| **File Manager** | `skills/file-manager/` | File system operations | `read_file()`, `write_file()`, `delete_file()`, `list_dir()` |
| **Heartbeat** | `skills/heartbeat/` | Health checks and monitoring | `check_health()`, `get_uptime()` |
| **System Info** | `skills/system-info/` | System statistics and information | `get_cpu_info()`, `get_memory_info()`, `get_disk_info()` |
| **Voice TTS** | `skills/voice-tts/` | Text-to-speech and voice generation | `speak()`, `generate_audio()`, `list_voices()` |
| **Web Research** | `skills/web-research/` | Web search and scraping | `web_search()`, `web_scrape()`, `extract_article()` |

---

## Bundled Skill Details

### 1. App Launcher (`skills/app-launcher/`)

**Purpose**: Launch and control desktop applications

**Tools**:
- `launch_app(app_name: string, args?: string[])` - Start an application
- `kill_app(app_name: string)` - Terminate an application
- `list_apps()` - List available applications
- `is_running(app_name: string)` - Check if app is running

**Use Case**:
```
Agent: Open VS Code with this folder
User: Done! VS Code opened to /path/to/project

Agent: Launch Slack
User: Slack is now open
```

**Limitations**: Desktop-only (not available in server/cloud)

---

### 2. Camera Capture (`skills/camera-capture/`)

**Purpose**: Capture images from camera/webcam

**Tools**:
- `capture_image()` - Take photo from default camera
- `capture_image(camera_id?: number)` - Capture from specific camera
- `list_cameras()` - List available cameras
- `save_image(image_path: string)` - Save captured image

**Use Case**:
```
Agent: Take a screenshot of your screen
User: Screenshot taken and saved

Agent: Capture from webcam
User: Photo captured from front camera
```

---

### 3. Daily Briefing (`skills/daily-briefing/`)

**Purpose**: Generate daily summaries from calendar, news, emails

**Tools**:
- `generate_briefing(date?: Date)` - Create daily summary
- `add_source(source_type: 'calendar'|'news'|'email')` - Add briefing source
- `schedule_briefing(time: string)` - Schedule recurring briefing

**Use Case**:
```
Agent: Give me today's briefing
User: Daily Briefing:
  - 3 calendar events today
  - 12 new emails
  - 5 top news stories
  - 3 Slack messages
```

---

### 4. Deep Reasoning (`skills/deep-reasoning/`)

**Purpose**: Extended thinking for complex problems (like OpenAI's o1)

**Tools**:
- `think_deeply(problem: string)` - Extended reasoning on problem
- `solve_step_by_step(problem: string)` - Step-by-step solution
- `verify_solution(problem: string, solution: string)` - Verify solution

**Use Case**:
```
Agent: Using deep reasoning, prove that P=NP
User: [Extended reasoning process]
 Step 1: ...
 Step 2: ...
 [detailed multi-step solution]
```

---

### 5. Example Skill (`skills/example-skill/`)

**Purpose**: Template for creating custom skills

**Content**:
- `SKILL.md` - Example skill definition
- `index.ts` - TypeScript implementation template
- `README.md` - Usage instructions
- `package.json` - Dependencies
- Example tools and parameters

**Usage**: Copy this folder as a starting point for new skills.

---

### 6. File Manager (`skills/file-manager/`)

**Purpose**: File system operations (read, write, delete, list)

**Tools**:
- `read_file(path: string, encoding?: 'utf-8'|'binary')` - Read file contents
- `write_file(path: string, content: string)` - Write file
- `delete_file(path: string)` - Delete file
- `list_directory(path: string)` - List directory contents
- `get_file_info(path: string)` - File metadata (size, modified date, etc.)

**Use Case**:
```
Agent: Read config.json and show me the API key
User: [reads file, extracts key]

Agent: Create a new file called notes.txt with my daily plan
User: File created successfully
```

---

### 7. Heartbeat (`skills/heartbeat/`)

**Purpose**: Health checks and monitoring

**Tools**:
- `check_health()` - Full system health check
- `get_uptime()` - Agent uptime
- `get_status_report()` - Detailed status
- `trigger_alert(message: string)` - Send alert

**Use Case**:
```
Agent: Check the system health
User: System Health Report:
  - Gateway: OK (uptime 2h 34m)
  - Agent Worker: OK (uptime 1h 22m)
  - Database: OK (10 active connections)
  - Memory: 450MB / 2GB (22%)
```

---

### 8. System Info (`skills/system-info/`)

**Purpose**: System statistics and hardware information

**Tools**:
- `get_cpu_info()` - CPU usage and details
- `get_memory_info()` - RAM usage
- `get_disk_info()` - Disk space usage
- `get_network_info()` - Network stats
- `get_os_info()` - Operating system info
- `get_process_list()` - Running processes

**Use Case**:
```
Agent: What's my current CPU and memory usage?
User: CPU: 34% (4 cores), Memory: 6.2GB / 16GB (38%)

Agent: List all running Python processes
User: [lists processes with PIDs and memory]
```

---

### 9. Voice TTS (`skills/voice-tts/`)

**Purpose**: Text-to-speech synthesis and voice generation

**Tools**:
- `speak(text: string, voice?: string)` - Speak text aloud
- `generate_audio(text: string, output_path?: string)` - Generate audio file
- `list_voices()` - Available voices (en-US-male, en-GB-female, etc.)
- `set_voice_params(speed?: number, pitch?: number)` - Adjust voice

**Use Case**:
```
Agent: Read this message aloud: "Hello, welcome back!"
User: [audio spoken with default voice]

Agent: Generate an audio file with a French accent
User: Audio file generated and saved
```

---

### 10. Web Research (`skills/web-research/`)

**Purpose**: Web search, scraping, and article extraction

**Tools**:
- `web_search(query: string, max_results?: number)` - Google/Bing search
- `web_scrape(url: string)` - Extract page content
- `extract_article(url: string)` - Extract article metadata
- `get_page_summary(url: string)` - Summarize page content

**Use Case**:
```
Agent: Search for "AI trends 2024" and give me top 3 results
User: [search results with titles, URLs, summaries]

Agent: Extract the full text from this article
User: [article content extracted and formatted]
```

---

## Creating Custom Skills

### Step 1: Copy Example Skill Template

```bash
cp -r skills/example-skill skills/my-skill
cd skills/my-skill
```

### Step 2: Update SKILL.md

Define your skill using the standardized format:

```markdown
# Skill: My Custom Skill

Brief description of what the skill does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Tools

- `tool_name(param1: type, param2?: type)`
- `another_tool(param: type) -> ReturnType`

## Parameters

### tool_name

```json
{
  "param1": {
    "type": "string",
    "description": "What this parameter does"
  },
  "param2": {
    "type": "number",
    "default": 5,
    "description": "Optional parameter"
  }
}
```

## Examples

### Example 1
```
Agent: [what the agent asks]
Output: [what the skill returns]
```

## Dependencies

- dependency1
- dependency2

## Limitations

- Limitation 1
- Limitation 2
```

### Step 3: Implement Tools (index.ts)

```typescript
// skills/my-skill/index.ts
export const tools = {
  tool_name: {
    description: "What this tool does",
    parameters: {
      type: "object",
      properties: {
        param1: {
          type: "string",
          description: "Param 1 description"
        }
      },
      required: ["param1"]
    },
    execute: async (params: { param1: string }) => {
      // Implementation here
      return { result: "..." };
    }
  },
  
  another_tool: {
    description: "Another tool",
    parameters: { /* ... */ },
    execute: async (params) => {
      // Implementation
      return { result: "..." };
    }
  }
};
```

### Step 4: Update package.json

```json
{
  "name": "@ag3nt/skill-my-skill",
  "version": "0.1.0",
  "description": "My custom skill for AG3NT",
  "main": "index.ts",
  "dependencies": {
    "@ag3nt/shared": "*"
  }
}
```

### Step 5: Update README.md

```markdown
# My Custom Skill

## Installation

```bash
cd skills/my-skill
npm install
```

## Usage

```typescript
import { tools } from './index';

const result = await tools.tool_name.execute({
  param1: "value"
});
```

## Configuration

[Document any configuration needed]
```

### Step 6: Test

```bash
# Run tests
npm test

# Test with agent
cd apps/agent
# Verify skill loads
python -c "from ag3nt_agent.tools.skills import load_skills; print(load_skills())"
```

---

## Skill Development Best Practices

### 1. Keep Skills Focused

One skill = one capability (or closely related capabilities):

```typescript
// ✅ GOOD: Single focused skill
// skills/weather/index.ts
export const tools = {
  get_weather: { /* ... */ },
  weather_forecast: { /* ... */ }
};

// ❌ BAD: Too many unrelated tools
// skills/everything/index.ts
export const tools = {
  get_weather: { /* ... */ },
  send_email: { /* ... */ },
  call_api: { /* ... */ }
};
```

### 2. Use TypeScript for Type Safety

```typescript
// ✅ GOOD: Typed parameters and returns
interface GetWeatherParams {
  city: string;
  units?: 'C' | 'F';
}

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
}

execute: async (params: GetWeatherParams): Promise<WeatherData> => {
  // Implementation
};

// ❌ BAD: No types
execute: async (params: any): any => {
  // Implementation
};
```

### 3. Validate Input Parameters

```typescript
// ✅ GOOD: Validate before use
execute: async (params: { city: string }) => {
  if (!params.city || params.city.trim() === '') {
    throw new Error('City name cannot be empty');
  }
  // Implementation
};

// ❌ BAD: No validation
execute: async (params: { city: string }) => {
  // Will fail with confusing error if city is empty
  const url = `https://api.weather.com?city=${params.city}`;
};
```

### 4. Provide Clear Documentation

```typescript
// ✅ GOOD: Clear descriptions
{
  description: "Get current weather for a city (supports cities worldwide)",
  parameters: {
    properties: {
      city: {
        type: "string",
        description: "City name (e.g., 'San Francisco', 'Tokyo')"
      },
      units: {
        type: "string",
        enum: ["C", "F"],
        description: "Temperature units: Celsius (C) or Fahrenheit (F)",
        default: "C"
      }
    }
  }
}

// ❌ BAD: Unclear
{
  description: "Weather tool",
  parameters: {
    properties: {
      c: { type: "string" },
      u: { type: "string" }
    }
  }
}
```

### 5. Handle Errors Gracefully

```typescript
// ✅ GOOD: Meaningful errors
execute: async (params) => {
  try {
    const response = await fetch(`https://api.weather.com?city=${params.city}`);
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch weather for ${params.city}: ${error.message}`);
  }
};

// ❌ BAD: Silent failures
execute: async (params) => {
  try {
    return await fetch(`https://api.weather.com?city=${params.city}`);
  } catch (error) {
    console.log('error'); // Logged but not returned
    return {};
  }
};
```

### 6. Test Thoroughly

```bash
# Create tests/skill.test.ts
import { tools } from '../index';

describe('Weather Skill', () => {
  it('should return weather data', async () => {
    const result = await tools.get_weather.execute({ city: 'San Francisco' });
    expect(result).toHaveProperty('temp');
    expect(result).toHaveProperty('humidity');
  });

  it('should handle invalid city', async () => {
    expect(() => 
      tools.get_weather.execute({ city: '' })
    ).toThrow('City name cannot be empty');
  });
});

# Run tests
npm test
```

---

## Loading Custom Skills

The agent automatically loads skills from `/skills` folder:

```python
# apps/agent/ag3nt_agent/tools/skills.py
def load_skills():
    """Load all custom skills from /skills"""
    skills = {}
    for skill_dir in SKILLS_PATH.iterdir():
        if skill_dir.is_dir():
            skill_name = skill_dir.name
            skill_module = load_skill_module(skill_dir)
            skills[skill_name] = skill_module
    return skills

# Available as tools in LLM context
available_tools = load_skills()
# Result: {
#   'app-launcher': {...},
#   'web-research': {...},
#   'my-skill': {...},
#   ...
# }
```

---

## Distributing Skills

### Option 1: Commit to Repository

Add your skill to `/skills` folder and commit:

```bash
git add skills/my-skill/
git commit -m "feat: add my-skill"
git push
```

### Option 2: Use as NPM Package

Publish to npm registry:

```bash
cd skills/my-skill
npm publish --access public
```

Then use in other projects:

```bash
npm install @ag3nt/skill-my-skill
```

---

## Related Documentation

- **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** - System design
- **[COMMUNITY_INTEGRATIONS.md](COMMUNITY_INTEGRATIONS.md)** - Integration framework
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Setup guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

---

## Example Skills Reference

For more examples, see:
- `skills/example-skill/` - Basic template
- `skills/web-research/` - Moderate complexity
- `skills/file-manager/` - Complex with multiple tools

