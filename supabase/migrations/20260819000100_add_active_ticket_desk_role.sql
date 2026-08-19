-- TVH Helferboard: neue Aktive-Helferrolle "Kasse Eintritt".
-- Die Migration aendert ausschliesslich Helferrollen und ist wiederholbar.

begin;

do $$
begin
  if
    not exists (
      select 1
      from public.helper_roles
      where category = 'Aktive'
        and name = 'Kasse Eintritt'
        and slots = 2
        and minimum_staff = 1
        and order_index = 4
    )
    or exists (
      select 1
      from public.helper_roles
      where category = 'Aktive'
        and name in (
          'Zeitnehmer',
          'Sekretär',
          'Wischer',
          'Verkauf',
          'Ordner'
        )
        and order_index <> case name
          when 'Zeitnehmer' then 1
          when 'Sekretär' then 2
          when 'Wischer' then 3
          when 'Verkauf' then 5
          when 'Ordner' then 6
        end
    )
  then
    -- Die vorhandenen fachlichen Rollen werden kurz aus dem eindeutigen
    -- order_index-Bereich verschoben, damit keine Zwischenkollision entsteht.
    update public.helper_roles
    set order_index = order_index + 100
    where category = 'Aktive'
      and name in (
        'Zeitnehmer',
        'Sekretär',
        'Wischer',
        'Kasse Eintritt',
        'Verkauf',
        'Ordner'
      );

    insert into public.helper_roles (
      name,
      category,
      slots,
      minimum_staff,
      order_index
    )
    select
      'Kasse Eintritt',
      'Aktive',
      2,
      1,
      4
    where not exists (
      select 1
      from public.helper_roles
      where category = 'Aktive'
        and name = 'Kasse Eintritt'
    );

    update public.helper_roles
    set
      slots = 2,
      minimum_staff = 1,
      order_index = 4
    where category = 'Aktive'
      and name = 'Kasse Eintritt';

    update public.helper_roles
    set order_index = case name
      when 'Zeitnehmer' then 1
      when 'Sekretär' then 2
      when 'Wischer' then 3
      when 'Verkauf' then 5
      when 'Ordner' then 6
    end
    where category = 'Aktive'
      and name in (
        'Zeitnehmer',
        'Sekretär',
        'Wischer',
        'Verkauf',
        'Ordner'
      );
  end if;
end;
$$;

commit;
