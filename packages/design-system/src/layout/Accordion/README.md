# Accordion

A vertical stack of collapsible items. Use for FAQs, settings groupings,
and any "show more on demand" pattern.

## Usage

```tsx
import { Accordion, AccordionItem } from '@tensaw/design-system';

<Accordion type="single" defaultValue="item-1" collapsible>
  <AccordionItem value="item-1" title="What is a claim?">
    A claim is the request submitted to a payer…
  </AccordionItem>
  <AccordionItem value="item-2" title="How is it processed?">
    Claims flow through validation…
  </AccordionItem>
</Accordion>
```

## Components

- **Accordion** — root; props: `type` (`'single' \| 'multiple'`), `value`/`defaultValue`, `onValueChange`, `collapsible`
- **AccordionItem** — individual item; props: `value`, `title`, `disabled`

Built on Radix's Accordion primitive.

## Accessibility

- Each item's trigger is a real button with `aria-expanded`
- Body is `region` with `aria-labelledby`
- Keyboard: Up/Down arrows navigate triggers, Home/End jump

## Related

- `<TabbedPanel>` — for view-switching (mutually exclusive content)
- `<Section>` — for always-visible groupings

## Anti-patterns

- ❌ **Don't** use Accordion to hide essential content. Users overlook
  collapsed sections; only collapse content that's genuinely optional.
- ❌ **Don't** use `type="single"` without `collapsible` — it forces one
  item to always be open, which surprises users on the first interaction.
