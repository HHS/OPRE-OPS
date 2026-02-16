# Claude Story Templates

This directory contains reusable story templates for consistent planning and implementation with Claude Code.

## Purpose

These templates help you:
- Plan implementation steps before writing code
- Document decisions and trade-offs
- Maintain consistency across team members
- Create comprehensive implementation plans for Claude Code

## Usage

1. **Copy the appropriate template** to a gitignored location:
   ```bash
   cp .claude/templates/feature-story.md .claude/stories/OPS-1234.md
   ```

2. **Fill in the specific details** for your story (ticket number, requirements, acceptance criteria)

3. **Use with Claude Code** by referencing the story file in your conversation or using plan mode

4. **Keep personal stories private** - The `.claude/stories/` directory is gitignored, so your in-progress work won't be committed

## Available Templates

### `feature-story.md`
For implementing new features or functionality. Includes sections for:
- Story overview and requirements
- Current state vs desired state
- Implementation steps
- Files to create/modify
- Test plan and validation

### `bug-story.md`
For fixing bugs and defects. Includes sections for:
- Bug description and reproduction steps
- Root cause analysis
- Fix implementation plan
- Regression prevention

### `refactor-story.md`
For code refactoring and technical improvements. Includes sections for:
- Current implementation issues
- Refactoring goals
- Step-by-step refactoring plan
- Risk assessment

## Best Practices

- **Start with the template** before coding to think through the approach
- **Update the story** as you discover new information during implementation
- **Use plan mode** in Claude Code to have Claude help design the implementation
- **Keep templates generic** - specific story details should only be in gitignored files
- **Review past stories** to learn patterns and improve future planning

## Directory Structure

```
.claude/
├── actions/           # Automation scripts (committed)
├── templates/         # Story templates (committed)
│   ├── README.md      # This file
│   ├── feature-story.md
│   ├── bug-story.md
│   └── refactor-story.md
└── stories/           # Your personal stories (gitignored)
    └── OPS-1234.md
```

## Examples

### Creating a Feature Story

```bash
# Copy template
cp .claude/templates/feature-story.md .claude/stories/OPS-5069.md

# Edit with your details
# [Fill in ticket number, requirements, acceptance criteria, etc.]

# Use with Claude Code
# Reference the story in your conversation or use plan mode
```

### Iterating on a Story

As you work with Claude Code, update your story file with:
- New findings or challenges discovered
- Updated implementation approach
- Additional test cases
- Notes for future reference

## Tips

- Use descriptive file names: `OPS-1234-procurement-tracker.md`
- Keep multiple stories for learning: Review previous implementations
- Add custom sections to templates as your team learns what works
- Consider creating specialized templates for your domain (e.g., `api-endpoint-story.md`)

## Contributing

To add or improve templates:
1. Test the template with a real story
2. Ensure it follows the existing format
3. Update this README with the new template description
4. Submit a PR with your changes
