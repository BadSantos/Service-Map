<script lang="ts">
import {
  cloneVNode,
  defineComponent,
  h,
  ref,
  type PropType,
  type VNode,
} from "vue";
import { cn } from "@/lib/utils";

let tooltipCounter = 0;

export default defineComponent({
  name: "Tooltip",
  props: {
    content: { type: String, default: "" },
    side: {
      type: String as PropType<"top" | "right" | "bottom" | "left">,
      default: "top",
    },
    class: { type: String, default: "" },
  },
  setup(props, { slots }) {
    const visible = ref(false);
    const tooltipId = `tooltip-${++tooltipCounter}`;

    const show = () => { visible.value = true; };
    const hide = () => { visible.value = false; };
    const contentClasses = () => cn(
      "absolute z-50 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md",
      props.side === "bottom" ? "top-full mt-2 left-1/2 -translate-x-1/2" : "",
      props.side === "left" ? "right-full mr-2 top-1/2 -translate-y-1/2" : "",
      props.side === "right" ? "left-full ml-2 top-1/2 -translate-y-1/2" : "",
      props.side === "top" ? "bottom-full mb-2 left-1/2 -translate-x-1/2" : "",
      props.class,
    );

    return () => {
      const children = slots.default?.() ?? [];
      const first = children[0] as VNode | undefined;
      const trigger = first
        ? cloneVNode(first, {
            "aria-describedby": props.content ? tooltipId : undefined,
            onMouseenter: show,
            onMouseleave: hide,
            onFocus: show,
            onBlur: hide,
          })
        : null;

      return h("span", { class: "relative inline-flex" }, [
        trigger,
        visible.value && props.content
          ? h("span", { id: tooltipId, role: "tooltip", class: contentClasses() }, props.content)
          : null,
      ]);
    };
  },
});
</script>